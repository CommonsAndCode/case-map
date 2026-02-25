import { useTranslation } from "react-i18next";

export function Legend() {
  const { t } = useTranslation();

  return (
    <div className="legend">
      <h3>{t("legendTitle")}</h3>

      <div className="legend-section">
        <strong>{t("legendScore")}</strong>
        <div className="legend-bar" />
        <div className="legend-scale">
          <span>{t("legendWorst")}</span>
          <span>{t("legendMixed")}</span>
          <span>{t("legendBest")}</span>
        </div>
      </div>

      <div className="legend-section">
        <strong>{t("legendMarkers")}</strong>
        <div>{t("legendSingle")}</div>
        <div>{t("legendCluster")}</div>
      </div>

      <div className="legend-section legend-hint">
        {t("legendHint")}
      </div>
    </div>
  );
}
