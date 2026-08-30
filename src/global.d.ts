import type {
  AuthPromptRequest,
  BootstrapData,
  CustomApiInfo,
  CustomApiInput,
  ModelInfo,
  ProviderInfo,
  SessionInfo,
  WindowConfig,
} from "./types";

declare global {
  interface Window {
    beichen: {
      bootstrap(): Promise<BootstrapData>;
      command(payload: Record<string, unknown>): Promise<unknown>;
      raw(payload: Record<string, unknown>): Promise<boolean>;
      restartBackend(patch: Partial<WindowConfig>): Promise<WindowConfig>;
      setModel(provider: string, modelId: string): Promise<{ model: ModelInfo | null; thinkingLevel: string; levels: string[] }>;
      setThinking(level: string): Promise<{ level: string; levels: string[] }>;
      listCustomApis(): Promise<CustomApiInfo[]>;
      saveCustomApi(input: CustomApiInput): Promise<{ providerId: string; modelId: string; config: WindowConfig; customApis: CustomApiInfo[] }>;
      deleteCustomApi(providerId: string): Promise<{ config: WindowConfig; customApis: CustomApiInfo[] }>;
      listSessions(): Promise<SessionInfo[]>;
      switchSession(sessionPath: string): Promise<{ cancelled?: boolean }>;
      listProviders(): Promise<ProviderInfo[]>;
      listModels(providerId: string): Promise<ModelInfo[]>;
      login(providerId: string, type: "api_key" | "oauth"): Promise<{ providerId: string; type: string }>;
      logout(providerId: string): Promise<boolean>;
      replyAuth(id: string, value: string): Promise<boolean>;
      cancelAuth(id: string): Promise<boolean>;
      pickDirectory(): Promise<string | null>;
      openPluginRoot(): Promise<string>;
      showItem(filePath: string): Promise<boolean>;
      markStarSeen(): Promise<boolean>;
      acceptSecurityNotice(): Promise<boolean>;
      newWindow(): Promise<number>;
      minimize(): Promise<void>;
      toggleMaximize(): Promise<boolean>;
      close(): Promise<void>;
      onPiEvent(callback: (payload: Record<string, unknown>) => void): () => void;
      onBackendStatus(callback: (payload: { state: string; message?: string }) => void): () => void;
      onAuthPrompt(callback: (payload: AuthPromptRequest) => void): () => void;
      onAuthEvent(callback: (payload: Record<string, unknown>) => void): () => void;
    };
  }
}

export {};
