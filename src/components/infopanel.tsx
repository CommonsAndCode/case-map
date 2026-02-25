import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CaseEntry } from "../app/types";

function hasScore(
  c: CaseEntry
): c is CaseEntry & { score: number } {
  return typeof c.score === "number";
}

export function InfoPanel({
  cases,
  selectedId,
  onClose,
  logoUrl,
  logoLink,
  showLogo = true,
}: {
  cases: CaseEntry[];
  selectedId: string | null;
  onClose: () => void;
  logoUrl?: string | null;
  logoLink?: string | null;
  showLogo?: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const selected = useMemo(
    () => (selectedId ? cases.find((x) => x.id === selectedId) ?? null : null),
    [cases, selectedId]
  );

    const avgScore = useMemo(() => {
      const validCases = cases.filter(hasScore);

      if (!validCases.length) return 0;

      return Math.round(
        validCases.reduce((sum, c) => sum + c.score, 0) /
          validCases.length
      );
    }, [cases]);

  return (
    <div className="info-ui">

      {showLogo && logoUrl && (
        <a
          href={logoLink ?? "#"}
          target="_blank"
          rel="noopener"
          className="info-ui-logo-link"
        >
          <img
            className="info-ui-logo"
            src={logoUrl}
            alt="Logo"
          />
        </a>
      )}

      <div className={`info-ui-panel ${expanded ? "is-expanded" : ""}`}>
        <button
          className="info-ui-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {cases.length} {t("cases")} · {t("avgScore")} {avgScore}
        </button>

        <div className="info-ui-content">

          {!selected && (
            <p>{t("selectMarker")}</p>
          )}

          {selected && (
            <>
              <h2>{selected.title}</h2>
              <p><strong>{t("score")}:</strong> {selected.score} / 100</p>
              <p>{selected.short}</p>
              <p>
                <strong>{t("categories")}:</strong>{" "}
                {selected.categories.join(" · ")}
              </p>
              <p>
                <strong>{t("updated")}:</strong> {selected.updated}
              </p>
              {selected.url && (
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener"
                >
                  {t("readFullCase")}
                </a>
              )}
              <div style={{ marginTop: 10 }}>
                <button onClick={onClose}>{t("close")}</button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
