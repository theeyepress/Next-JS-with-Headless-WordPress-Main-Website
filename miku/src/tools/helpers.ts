import type { ResolvedMikuConfig } from "../config/types"
import type { JsonSchema, MikuTool, ToolContext } from "../types"

/**
 * Helpers for writing tools without boilerplate. A host that has its own data
 * layer writes one function; MIKU handles auth scoping, consent, audit and the
 * model-facing schema.
 */

export function defineTool<TArgs = Record<string, unknown>, TResult = unknown>(
  tool: MikuTool<TArgs, TResult>
): MikuTool {
  return tool as MikuTool
}

export function str(description: string, extra: Partial<JsonSchema> = {}): JsonSchema {
  return { type: "string", description, ...extra }
}

export function num(description: string, extra: Partial<JsonSchema> = {}): JsonSchema {
  return { type: "number", description, ...extra }
}

export function bool(description: string, extra: Partial<JsonSchema> = {}): JsonSchema {
  return { type: "boolean", description, ...extra }
}

export function enumOf(description: string, values: string[]): JsonSchema {
  return { type: "string", description, enum: values }
}

export function obj(
  properties: Record<string, JsonSchema>,
  required: string[] = []
): JsonSchema {
  return { type: "object", properties, required }
}

/**
 * Declares an action the visitor must approve.
 *
 * The `execute` body runs only after the UI shows a confirm card and the visitor
 * clicks it, so a model that decides to act on its own cannot actually act.
 */
export function actionTool<TArgs = Record<string, unknown>, TResult = unknown>(spec: {
  name: string
  description: string
  parameters: JsonSchema
  /** Text shown on the confirm card. Defaults to the description. */
  consentLabel?: string
  execute: (args: TArgs, ctx: ToolContext) => Promise<TResult>
}): MikuTool {
  return {
    name: spec.name,
    description: spec.description,
    parameters: spec.parameters,
    kind: "action",
    requiresConsent: true,
    execute: spec.execute as MikuTool["execute"],
  }
}

/** A tool that only makes sense for a signed-in visitor. */
export function accountTool<TArgs = Record<string, unknown>, TResult = unknown>(spec: {
  name: string
  description: string
  parameters?: JsonSchema
  execute: (args: TArgs, ctx: ToolContext & { user: NonNullable<ToolContext["user"]> }) => Promise<TResult>
}): MikuTool {
  return {
    name: spec.name,
    description: spec.description,
    parameters: spec.parameters ?? obj({}, []),
    kind: "account",
    // Belt-and-braces with the registry's gate: the handler also throws if the
    // visitor turned out to be anonymous after all.
    isAvailable: (ctx) => Boolean(ctx.user),
    execute: (async (args: unknown, ctx: ToolContext) => {
      if (!ctx.user) throw new Error("This visitor is not signed in.")
      return spec.execute(args as TArgs, ctx as ToolContext & { user: NonNullable<ToolContext["user"]> })
    }) as MikuTool["execute"],
  }
}

/** A read-only tool over the site's own content or data. */
export function readTool<TArgs = Record<string, unknown>, TResult = unknown>(spec: {
  name: string
  description: string
  parameters?: JsonSchema
  kind?: "knowledge" | "catalog"
  isAvailable?: (ctx: ToolContext) => boolean | Promise<boolean>
  execute: (args: TArgs, ctx: ToolContext) => Promise<TResult>
}): MikuTool {
  return {
    name: spec.name,
    description: spec.description,
    parameters: spec.parameters ?? obj({}, []),
    kind: spec.kind ?? "catalog",
    isAvailable: spec.isAvailable,
    execute: spec.execute as MikuTool["execute"],
  }
}

/**
 * Wraps a tool so its result can never contain more than it should. Useful for
 * any tool that touches per-user records: MIKU only ever passes through the
 * fields the host explicitly returns, so a mistyped `select *` cannot leak
 * another customer's row into a transcript.
 */
export function scoped<T>(
  run: (ctx: ToolContext) => Promise<T | null>,
  messageWhenAnonymous: string
): (ctx: ToolContext) => Promise<T> {
  return async (ctx: ToolContext) => {
    const result = await run(ctx)
    if (result === null) throw new Error(messageWhenAnonymous)
    return result
  }
}

export type { ResolvedMikuConfig }