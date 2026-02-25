// src/App.tsx (Änderungen)
import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./styles/style.css";
import "./styles/darkmode.css";

import { MapView } from "./components/mapview.tsx";
import { Legend } from "./components/legend.tsx";
import { InfoPanel } from "./components/infopanel.tsx";
import { TopLeftControls } from "./components/topleft-controls.tsx";
import { Footer } from "./components/footer.tsx";

import { getInitialTheme, applyTheme } from "./app/theme.ts";
import type { Theme } from "./app/theme.ts";
import type { CaseEntry } from "./app/types.ts";

import "./app/i18n.ts";

import {
  FilterBar,
  DEFAULT_FILTER,
  applyCaseFilter,
  type CaseFilterState,
} from "./components/filters.tsx";

type MapApi = { recenter: () => void };

export default function App() {
  const { t } = useTranslation();
  const [cases, setCases] = useState<CaseEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [colorblind, setColorblind] = useState(false);

  const [filter, setFilter] = useState<CaseFilterState>(DEFAULT_FILTER);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapApiRef = useRef<MapApi | null>(null);

  useEffect(() => {
    applyTheme(theme);
    document.documentElement.setAttribute(
      "data-colorblind",
      colorblind ? "1" : "0"
    );
  }, [theme, colorblind]);

  useEffect(() => {
    let mounted = true;

    fetch(`${import.meta.env.BASE_URL}data/cases.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CaseEntry[]) => {
        if (!mounted) return;
        setCases(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError(t("errorLoadFailed"));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCases = useMemo(() => applyCaseFilter(cases, filter), [cases, filter]);

  useEffect(() => {
    if (!selectedId) return;
    const stillThere = filteredCases.some((c) => c.id === selectedId);
    if (!stillThere) setSelectedId(null);
  }, [filteredCases, selectedId]);

  return (
    <>
      <FilterBar
        cases={cases}
        value={filter}
        onChange={setFilter}
        onClear={() => setFilter(DEFAULT_FILTER)}
      />

      <MapView
        cases={filteredCases}
        theme={theme}
        onSelectCase={setSelectedId}
        onMapReady={(api) => { mapApiRef.current = api; }}
        topLeftControls={
          <TopLeftControls
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            colorblind={colorblind}
            onToggleColorblind={() => setColorblind((v) => !v)}
            onRecenter={() => mapApiRef.current?.recenter()}
          />
        }
      />

      <Legend />

      <InfoPanel
        cases={filteredCases}
        selectedId={selectedId}
        onClose={() => setSelectedId(null)}
        logoUrl={`${import.meta.env.BASE_URL}img/logo.svg`}
        logoLink="https://commons-and-code.eu/de/"
      />

      <Footer
        privacyUrl="https://commons-and-code.eu/en/legal/privacy/"
        imprintUrl="https://commons-and-code.eu/en/legal/imprint/"
      />

      {loading && (
        <>
          <div className="loading-backdrop" />
          <div className="loading-spinner" />
        </>
      )}

      {error && (
        <div className="overlay">
          <div className="overlay-content">
            <strong>{t("errorTitle")}</strong>
            <div style={{ marginTop: 8 }}>{error}</div>
          </div>
        </div>
      )}
    </>
  );
}
