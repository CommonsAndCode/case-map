import { useMemo, useState } from "react";
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
}: {
  cases: CaseEntry[];
  selectedId: string | null;
  onClose: () => void;
}) {
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

      <a
        href="https://commons-and-code.eu/de/"
        target="_blank"
        rel="noopener"
        className="info-ui-logo-link"
      >
        <img
          className="info-ui-logo"
          src={`${import.meta.env.BASE_URL}img/logo.svg`}
          alt="Project website"
        />
      </a>

      <div className={`info-ui-panel ${expanded ? "is-expanded" : ""}`}>
        <button
          className="info-ui-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {cases.length} Cases · Ø {avgScore}
        </button>

        <div className="info-ui-content">

          {!selected && (
            <p>Select a marker to see details.</p>
          )}

          {selected && (
            <>
              <h2>{selected.title}</h2>
              <p><strong>Score:</strong> {selected.score} / 100</p>
              <p>{selected.short}</p>
              <p>
                <strong>Categories:</strong>{" "}
                {selected.categories.join(" · ")}
              </p>
              <p>
                <strong>Updated:</strong> {selected.updated}
              </p>
              {selected.url && (
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener"
                >
                  Read full case
                </a>
              )}
              <div style={{ marginTop: 10 }}>
                <button onClick={onClose}>Close</button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
