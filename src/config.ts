// Parse application configuration from URL query parameters.
// Config is read once on load and never changes.

import type { AppConfig, Theme } from "./types.ts";

const BASE_URL = import.meta.env.BASE_URL;

const STANDALONE_DEFAULTS: AppConfig = {
  mode: "standalone",
  dataUrl: `${BASE_URL}data/cases.json`,
  theme: null,
  showThemeToggle: true,
  showLogo: true,
  logoUrl: `${BASE_URL}img/logo.svg`,
  logoLink: "https://commons-and-code.eu",
  imprintUrl: "https://commons-and-code.eu/en/legal/imprint/",
  privacyUrl: "https://commons-and-code.eu/en/legal/privacy/",
  showFooter: true,
  primaryColor: null,
  tiles: "ask",
  proposeUrl: "https://hub.commons-and-code.eu/apps/forms/s/zWaDHQ728cPJYDbDgBXmmq4F",
};

const EMBED_DEFAULTS: AppConfig = {
  mode: "embed",
  dataUrl: `${BASE_URL}data/cases.json`,
  theme: null,
  showThemeToggle: false,
  showLogo: false,
  logoUrl: null,
  logoLink: null,
  imprintUrl: null,
  privacyUrl: null,
  showFooter: false,
  primaryColor: null,
  tiles: "off",
  proposeUrl: null,
};

/**
 * Reject URLs with dangerous schemes (javascript:, data:, vbscript:, etc.).
 * Only allows http:, https:, and relative URLs.
 */
export function sanitiseUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Relative URLs (including protocol-relative) are safe.
  if (trimmed.startsWith("/") || trimmed.startsWith(".")) return trimmed;

  try {
    const parsed = new URL(trimmed, window.location.href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    // Malformed URL — reject.
  }
  return null;
}

function isValidTheme(v: string): v is Theme {
  return v === "light" || v === "dark";
}

function isValidTiles(v: string): v is AppConfig["tiles"] {
  return v === "on" || v === "off" || v === "ask";
}

/**
 * Parse application configuration from URL query parameters.
 *
 * Supported parameters:
 * - mode        "standalone" | "embed" (default: "standalone")
 * - dataUrl     URL to fetch cases.json from
 * - theme       "light" | "dark"
 * - logo        Logo image URL (implies showLogo=true)
 * - logoLink    Logo click target URL
 * - imprintUrl  Imprint page URL (implies showFooter=true)
 * - privacyUrl  Privacy page URL (implies showFooter=true)
 * - color       CSS colour value for primary accent
 * - tiles       "on" | "off" | "ask" (external VersaTiles loading)
 * - proposeUrl  "Propose a case" link URL
 */
export function parseConfig(search: string): AppConfig {
  const params = new URLSearchParams(search);
  const mode = params.get("mode") === "embed" ? "embed" : "standalone";
  const defaults = mode === "embed" ? EMBED_DEFAULTS : STANDALONE_DEFAULTS;

  const theme = params.get("theme");
  const dataUrl = params.get("dataUrl");
  const logo = params.get("logo");
  const logoLink = params.get("logoLink");
  const imprintUrl = params.get("imprintUrl");
  const privacyUrl = params.get("privacyUrl");
  const color = params.get("color");
  const tiles = params.get("tiles");
  const proposeUrl = params.get("proposeUrl");

  const resolvedLogo = logo ?? defaults.logoUrl;
  const resolvedImprint = sanitiseUrl(imprintUrl) ?? defaults.imprintUrl;
  const resolvedPrivacy = sanitiseUrl(privacyUrl) ?? defaults.privacyUrl;

  return {
    mode,
    dataUrl: sanitiseUrl(dataUrl) ?? defaults.dataUrl,
    theme: theme && isValidTheme(theme) ? theme : defaults.theme,
    showThemeToggle: defaults.showThemeToggle,
    showLogo: logo ? true : defaults.showLogo,
    logoUrl: sanitiseUrl(resolvedLogo),
    logoLink: sanitiseUrl(logoLink) ?? defaults.logoLink,
    imprintUrl: resolvedImprint,
    privacyUrl: resolvedPrivacy,
    showFooter:
      resolvedImprint || resolvedPrivacy ? true : defaults.showFooter,
    primaryColor: color ?? defaults.primaryColor,
    tiles: tiles && isValidTiles(tiles) ? tiles : defaults.tiles,
    proposeUrl: sanitiseUrl(proposeUrl) ?? defaults.proposeUrl,
  };
}
