/** Application configuration parsed from URL query parameters. */
export interface AppConfig {
  /** Operating mode. "standalone" shows full chrome; "embed" hides it. */
  mode: "standalone" | "embed";

  /** URL to fetch cases.json from. */
  dataUrl: string;

  /** Override UI language. null = browser detection. */
  lang: "de" | "en" | null;

  /** Override theme. null = system preference / localStorage. */
  theme: "light" | "dark" | null;

  /** Whether to show the dark/light toggle button. */
  showThemeToggle: boolean;

  /** Whether to show the logo in the info panel. */
  showLogo: boolean;

  /** Logo image URL. null = no logo. */
  logoUrl: string | null;

  /** Logo click target URL. null = no link. */
  logoLink: string | null;

  /** Imprint page URL. null = no link. */
  imprintUrl: string | null;

  /** Privacy page URL. null = no link. */
  privacyUrl: string | null;

  /** Whether to show the footer. */
  showFooter: boolean;

  /** CSS colour override for the primary/accent colour. */
  primaryColor: string | null;
}

const BASE_URL = import.meta.env.BASE_URL;

const STANDALONE_DEFAULTS: AppConfig = {
  mode: "standalone",
  dataUrl: `${BASE_URL}data/cases.json`,
  lang: null,
  theme: null,
  showThemeToggle: true,
  showLogo: true,
  logoUrl: `${BASE_URL}img/logo.svg`,
  logoLink: "https://commons-and-code.eu",
  imprintUrl: "https://commons-and-code.eu/en/legal/imprint/",
  privacyUrl: "https://commons-and-code.eu/en/legal/privacy/",
  showFooter: true,
  primaryColor: null,
};

const EMBED_DEFAULTS: AppConfig = {
  mode: "embed",
  dataUrl: `${BASE_URL}data/cases.json`,
  lang: null,
  theme: null,
  showThemeToggle: false,
  showLogo: false,
  logoUrl: null,
  logoLink: null,
  imprintUrl: null,
  privacyUrl: null,
  showFooter: false,
  primaryColor: null,
};

function isValidLang(v: string): v is "de" | "en" {
  return v === "de" || v === "en";
}

function isValidTheme(v: string): v is "light" | "dark" {
  return v === "light" || v === "dark";
}

/**
 * Parse application configuration from URL query parameters.
 *
 * Supported parameters:
 * - mode        "standalone" | "embed" (default: "standalone")
 * - dataUrl     URL to fetch cases.json from
 * - lang        "de" | "en"
 * - theme       "light" | "dark"
 * - logo        Logo image URL (implies showLogo=true)
 * - logoLink    Logo click target URL
 * - imprintUrl  Imprint page URL (implies showFooter=true)
 * - privacyUrl  Privacy page URL (implies showFooter=true)
 * - color       CSS colour value for primary accent
 */
export function parseConfig(search: string): AppConfig {
  const params = new URLSearchParams(search);
  const mode = params.get("mode") === "embed" ? "embed" : "standalone";
  const defaults = mode === "embed" ? EMBED_DEFAULTS : STANDALONE_DEFAULTS;

  const lang = params.get("lang");
  const theme = params.get("theme");
  const dataUrl = params.get("dataUrl");
  const logo = params.get("logo");
  const logoLink = params.get("logoLink");
  const imprintUrl = params.get("imprintUrl");
  const privacyUrl = params.get("privacyUrl");
  const color = params.get("color");

  const resolvedLogo = logo ?? defaults.logoUrl;
  const resolvedImprint = imprintUrl ?? defaults.imprintUrl;
  const resolvedPrivacy = privacyUrl ?? defaults.privacyUrl;

  return {
    mode,
    dataUrl: dataUrl ?? defaults.dataUrl,
    lang: lang && isValidLang(lang) ? lang : defaults.lang,
    theme: theme && isValidTheme(theme) ? theme : defaults.theme,
    showThemeToggle: defaults.showThemeToggle,
    showLogo: logo ? true : defaults.showLogo,
    logoUrl: resolvedLogo,
    logoLink: logoLink ?? defaults.logoLink,
    imprintUrl: resolvedImprint,
    privacyUrl: resolvedPrivacy,
    showFooter: resolvedImprint || resolvedPrivacy ? true : defaults.showFooter,
    primaryColor: color ?? defaults.primaryColor,
  };
}
