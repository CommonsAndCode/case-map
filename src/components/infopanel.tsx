import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CaseEntry } from "../app/types";
import { useConfig } from "../app/ConfigContext";
import { sanitiseUrl } from "../app/config";

export function InfoPanel({
  cases,
  selectedId,
  onClose,
}: {
  cases: CaseEntry[];
  selectedId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { showLogo, logoUrl, logoLink } = useConfig();

  const selected = useMemo(
    () => (selectedId ? cases.find((x) => x.id === selectedId) ?? null : null),
    [cases, selectedId]
  );

  const safeUrl = selected?.url ? sanitiseUrl(selected.url) : null;

  return (
    <div className="info-ui">
      {showLogo && logoUrl && (
        <a
          href={logoLink ?? "#"}
          target="_blank"
          rel="noopener"
          className="info-ui-logo-link"
        >
          <img className="info-ui-logo" src={logoUrl} alt="Logo" />
        </a>
      )}

      {selected && (
        <div className="info-ui-panel is-expanded">
          <div className="info-ui-content">
            <h2>{selected.title}</h2>

            {selected.rating && (
              <p className="info-ui-rating" data-rating={selected.rating}>
                {t(`rating.${selected.rating}`)}
              </p>
            )}

            <p>{selected.short}</p>

            {selected.categories.length > 0 && (
              <p>
                <strong>{t("categories")}:</strong>{" "}
                {selected.categories.join(" · ")}
              </p>
            )}

            {selected.updated && (
              <p className="info-ui-meta">
                {t("updated")}: {selected.updated}
              </p>
            )}

            {safeUrl && (
              <a
                className="info-ui-link"
                href={safeUrl}
                target="_blank"
                rel="noopener"
              >
                {t("readFullCase")} ↗
              </a>
            )}

            <div style={{ marginTop: 10 }}>
              <button onClick={onClose}>{t("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
