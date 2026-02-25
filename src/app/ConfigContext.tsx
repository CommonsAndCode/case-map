import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { parseConfig } from "./config";
import type { AppConfig } from "./config";

const ConfigContext = createContext<AppConfig | null>(null);

/**
 * Provides the application configuration parsed from URL query parameters.
 * Must wrap the entire app — config is read once and never changes.
 */
export function ConfigProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => parseConfig(window.location.search), []);

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

/**
 * Access the application configuration.
 * Must be called inside a <ConfigProvider>.
 */
export function useConfig(): AppConfig {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig() must be used within a <ConfigProvider>");
  }
  return ctx;
}
