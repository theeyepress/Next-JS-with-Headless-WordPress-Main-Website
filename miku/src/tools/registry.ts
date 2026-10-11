import type { ResolvedMikuConfig } from "../config/types"
import type { JsonSchema, MikuTool, ToolContext, ToolResult } from "../types"

/** A tool that has been checked for availability and is ready to be called. */
export interface ResolvedTool {
  name: string
  description: string
  parameters: JsonSchema
  kind: NonNullable<MikuTool["kind"]>
  requiresConsent: boolean
  execute: MikuTool["execute"]
  /**
   * Carried from the tool itself rather than re-read from config, so a tool is
   * authorized on its own terms however it was registered. Looking it up in
   * `config.tools` would silently skip any tool registered by another route.
   */
  isAvailable?: MikuTool["isAvailable"]
}

export class ToolRegistry {
  private tools = new Map<string, ResolvedTool>()

  constructor(private config: ResolvedMikuConfig) {}

  /** Later registrations win, so a host can override any built-in by name. */
  register(tool: MikuTool): void {
    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      kind: tool.kind ?? "catalog",
      requiresConsent: tool.requiresConsent ?? tool.kind === "action",
      execute: tool.execute,
      isAvailable: tool.isAvailable,
    })
  }

  registerAll(tools: MikuTool[]): void {
    for (const t of tools) this.register(t)
  }

  get(name: string): ResolvedTool | undefined {
    return this.tools.get(name)
  }

  list(): ResolvedTool[] {
    return [...this.tools.values()]
  }

  /**
   * Narrows the tool list to what this visitor may actually use.
   *
   * Availability is re-evaluated per request. A tool that returns false is not
   * shown to the model at all, so the model cannot even attempt it — this is the
   * first of two authorisation layers. The second is inside each tool's own
   * handler, which must re-check ownership regardless of what the model asks for.
   */
  async available(ctx: ToolContext): Promise<ResolvedTool[]> {
    const results: ResolvedTool[] = []
    for (const tool of this.list()) {
      if (tool.isAvailable) {
        const ok = await tool.isAvailable(ctx)
        if (!ok) continue
      }
      if (this.config.security.requireUserForTools && !ctx.user) continue
      results.push(tool)
    }
    return results
  }

  /** Converts a registry entry into the JSON Schema shape the providers want. */
  toProviderSchema(tools: ResolvedTool[]): {
    name: string
    description: string
    parameters: unknown
  }[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as unknown,
    }))
  }
}

/** Coerces a model's arguments to the declared types. Models are inconsistent. */
export function coerceArgs(args: Record<string, unknown>, schema: JsonSchema): Record<string, unknown> {
  const out: Record<string, unknown> = { ...args }
  const props = schema.properties ?? {}
  for (const [key, value] of Object.entries(out)) {
    const prop = props[key]
    if (!prop) continue
    if (prop.type === "number" && typeof value === "string") {
      const n = Number(value)
      if (Number.isFinite(n)) out[key] = n
    }
    if (prop.type === "number" && typeof value === "boolean") {
      out[key] = value ? 1 : 0
    }
    if (prop.type === "boolean" && typeof value === "string") {
      out[key] = /^(true|yes|1)$/i.test(value)
    }
    if (prop.type === "string" && (typeof value === "number" || typeof value === "boolean")) {
      out[key] = String(value)
    }
  }
  return out
}

export function missingRequired(
  args: Record<string, unknown>,
  schema: JsonSchema
): string[] {
  const required = schema.required ?? []
  return required.filter((key) => args[key] === undefined || args[key] === null || args[key] === "")
}

/**
 * Runs one tool call and returns a result the model can read.
 *
 * Authorisation is re-checked here, at the moment of execution, and it is
 * deliberately not the same check the model was shown. Hiding an unavailable
 * tool from the provider schema is the first layer; this is the second, and it
 * is the one that holds. A model can be made to emit a tool name it was never
 * offered — by hallucination, by a prompt injection inside crawled content, or
 * by a provider bug — and none of those should reach a database query.
 *
 * `observation` is what goes back to the model, so it is deliberately compact —
 * a tool that dumps 4000 characters of JSON burns the context window and makes
 * the answer worse. Errors are returned as `ok: false` with an explanation the
 * model can act on, rather than thrown, so the model can recover.
 */
export async function runTool(
  registry: ToolRegistry,
  name: string,
  rawArgs: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const allowed = await registry.available(ctx)
  const allowedNames = allowed.map((t) => t.name)

  // Only names this visitor could legitimately use are echoed back, so an
  // error message cannot be used to enumerate the hidden ones.
  if (!allowedNames.includes(name)) {
    return {
      id: "",
      name,
      ok: false,
      observation: `No tool named "${name}" is available for this request. Available tools: ${
        allowedNames.join(", ") || "none"
      }.`,
    }
  }

  const tool = allowed.find((t) => t.name === name)
  if (!tool) {
    return { id: "", name, ok: false, observation: `The tool "${name}" is unavailable.` }
  }

  const missing = missingRequired(rawArgs, tool.parameters)
  if (missing.length > 0) {
    return {
      id: "",
      name,
      ok: false,
      observation: `Missing required argument(s): ${missing.join(", ")}. Ask the visitor for them, then call again.`,
    }
  }

  const args = coerceArgs(rawArgs, tool.parameters)

  try {
    const data = await tool.execute(args, ctx)
    return {
      id: "",
      name,
      ok: true,
      observation: renderObservation(data),
      data,
      label: tool.kind === "action" ? `${name.replace(/_/g, " ")} — done` : undefined,
    }
  } catch (err) {
    const message = (err as Error)?.message ?? String(err)
    return {
      id: "",
      name,
      ok: false,
      observation: `The tool failed: ${message}. Tell the visitor honestly, do not retry more than once, and offer to hand them to the team.`,
    }
  }
}

/** Compact, readable rendering of a tool's return value for the model. */
export function renderObservation(data: unknown): string {
  if (data === null || data === undefined) return "(no result)"
  if (typeof data === "string") return data
  if (typeof data === "number" || typeof data === "boolean") return String(data)
  try {
    const json = JSON.stringify(data, null, 2)
    return json.length > 6000 ? `${json.slice(0, 6000)}\n…(truncated)` : json
  } catch {
    return String(data)
  }
}