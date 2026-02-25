import { useTranslation } from "react-i18next";
import { useConfig } from "../app/ConfigContext";

export function Footer() {
  const { t } = useTranslation();
  const { privacyUrl, imprintUrl } = useConfig();

  const hasLinks = privacyUrl || imprintUrl;

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__inner">
        {hasLinks && (
          <nav className="app-footer__links" aria-label="Legal">
            {privacyUrl && <a href={privacyUrl}>{t("privacy")}</a>}
            {imprintUrl && <a href={imprintUrl}>{t("imprint")}</a>}
          </nav>
        )}

        <div className="app-footer__note">
          {t("noCookies")}
        </div>
      </div>
    </footer>
  );
}
