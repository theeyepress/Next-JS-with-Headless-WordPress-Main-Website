/**
 * MIKU — a self-hosted, site-aware AI assistant.
 *
 * Server-side entry point. Import the widget from "@wpcodingpress/miku/client" and the config
 * helper from "@wpcodingpress/miku/config".
 */

// Config
export {
  defineMiku,
  resolveConfig,
  mikuConfigSchema,
  DEFAULT_EXCLUDE,
  type MikuConfig,
  type ResolvedMikuConfig,
  type MikuBrandConfig,
  type MikuSiteConfig,
  type MikuLlmConfig,
  type MikuRetrievalConfig,
  type MikuPersonaConfig,
  type MikuActionsConfig,
  type MikuWidgetConfig,
  type MikuSecurityConfig,
  type MikuDatabase,
  type MikuAuthConfig,
  type MikuRateLimitConfig,
  type MikuProviderId,
} from "./config"

// Knowledge
export {
  ingest,
  retrieve,
  discoverUrls,
  crawl,
  extractPage,
  decodeEntities,
  chunkPage,
  sanitiseCrawledText,
  matchesGlob,
  isPathIncluded,
  hash,
  cosineSimilarity,
  createStore,
  SqlStore,
  MemoryStore,
  Dialect,
  formatContext,
  sectionOf,
  type IngestReport,
  type IngestOptions,
  type KnowledgeStore,
  type KnowledgeStats,
  type RetrieveResult,
  type ChunkRecord,
  type DocumentRecord,
  type ExtractedPage,
} from "./knowledge"

// Runtime
export {
  handleMikuChat,
  runAgent,
  executeConfirmedAction,
  buildRegistry,
  checkRateLimit,
  buildSystemPrompt,
  buildUserContext,
  formatKnowledge,
  formatObservations,
  fallbackAnswer,
  type AgentEvent,
  type AgentRequest,
  type AgentResult,
  type ChatMessage,
  type PendingAction,
  type HandleChatOptions,
  type MikuChatBody,
  type MikuStreamEvent,
} from "./runtime"

// Providers
export {
  createProvider,
  createGeminiProvider,
  createGroqProvider,
  getEmbedder,
  streamWithFallback,
  isGeminiConfigured,
  isGroqConfigured,
  embedWithGemini,
  ProviderError,
  type LlmProvider,
  type LlmMessage,
  type LlmChunk,
} from "./llm"

// Tools
export {
  defineTool,
  readTool,
  accountTool,
  actionTool,
  queryTool,
  httpTool,
  createKnowledgeTools,
  createActionTools,
  ToolRegistry,
  runTool,
  renderObservation,
  coerceArgs,
  missingRequired,
  obj,
  str,
  num,
  bool,
  enumOf,
  type HttpToolOptions,
} from "./tools"

// Types
export type {
  MikuTool,
  ToolContext,
  ToolCall,
  ToolResult,
  RetrievedChunk,
  Citation,
  MikuUser,
  JsonSchema,
} from "./types"