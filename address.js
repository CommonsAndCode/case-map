let marker = null;
let searchMarker = null;
let geojsonLayerRef = null;
let debounceTimer = null;
let feedbackTimer = null;
let reqSeq = 0;

let dataMaps = {
  unterschriftenMap: {},
  wkGesammeltMap: {},
  bezirkUnterschriftenMap: {},
  bezirkGesammeltMap: {},
  kandidatMap: {},
  linkMap: {}
};

export function setDataMaps(maps){
  dataMaps = { ...dataMaps, ...maps };
}


function getLang(){ return localStorage.getItem("lang") || "de"; }
function t(key){
  const lang = getLang();
  return (window.I18N && window.I18N[lang] && window.I18N[lang][key]) || "";
}


function toInt(v){
  return parseInt(String(v ?? "").replace(/\D/g, ""), 10) || 0;
}
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
function pct(val, goal){
  const p = Math.round((toInt(val) / goal) * 100);
  return clamp(p, 0, 100);
}

function buildWkDetails(props){
  const nr = String(props.WKNR ?? props.Nummer ?? "")
    .replace(/\D/g, "")
    .padStart(4, "0");

  const name =
    (props.WKNAME ?? props["WK Name"] ?? "").trim() ||
    `Bezirk ${nr.slice(0,2)} Wahlkreis ${nr.slice(2,4)}`;

  const wkBest = dataMaps.unterschriftenMap[nr] || "0";
  const wkGes  = dataMaps.wkGesammeltMap?.[nr] || "0";

  const bezirk = nr.slice(0, 2);
  const bBest = dataMaps.bezirkUnterschriftenMap?.[bezirk] ?? "0";
  const bGes  = dataMaps.bezirkGesammeltMap?.[bezirk] ?? "0";

  const WK_GOAL = 60;
  const BZ_GOAL = 220;

  const wkPct = pct(wkBest, WK_GOAL);
  const bzPct = pct(bBest, BZ_GOAL);

  const kandidat = dataMaps.kandidatMap[nr] || null;
  const kandidatText = kandidat ? kandidat : t("no_direct_candidate");

  const more = t("more_info_label") || "Mehr Infos";
  const link = dataMaps.linkMap[nr]
    ? `<a class="wk-link" href="${dataMaps.linkMap[nr]}" target="_blank" rel="noopener">${more}</a>`
    : "";

  return `
  <div class="wk-popup">
    <div class="wk-popup__head">
      <div class="wk-popup__title">${t("wk_label")} ${nr}</div>
      <div class="wk-popup__sub">${name}</div>
    </div>

    <div class="wk-popup__section">
      <div class="wk-popup__section-title">Wahlkreis</div>
      <div class="wk-popup__rows">
        <div class="wk-row"><span>Bestätigt</span><strong>${wkBest} / ${WK_GOAL}</strong></div>
        <div class="wk-row wk-row--muted"><span>Gesammelt</span><strong>${wkGes}</strong></div>
      </div>
      <div class="wk-progress" role="progressbar"
           aria-label="Wahlkreis Fortschritt"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${wkPct}">
        <div class="wk-progress__bar" style="width:${wkPct}%"></div>
        <div class="wk-progress__label">${wkPct}%</div>
      </div>
    </div>

    <div class="wk-popup__divider" aria-hidden="true"></div>

    <div class="wk-popup__section">
      <div class="wk-popup__section-title">Bezirk ${bezirk}</div>
      <div class="wk-popup__rows">
        <div class="wk-row"><span>Bestätigt</span><strong>${bBest} / ${BZ_GOAL}</strong></div>
        <div class="wk-row wk-row--muted"><span>Gesammelt</span><strong>${bGes}</strong></div>
      </div>
      <div class="wk-progress wk-progress--bezirk" role="progressbar"
           aria-label="Bezirk Fortschritt"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${bzPct}">
        <div class="wk-progress__bar" style="width:${bzPct}%"></div>
        <div class="wk-progress__label">${bzPct}%</div>
      </div>
    </div>

    <div class="wk-popup__divider" aria-hidden="true"></div>

    <div class="wk-popup__foot">
      <div class="wk-popup__meta">
        <span>${t("candidate_label")}:</span>
        <strong>${kandidatText}</strong>
      </div>
      ${link ? `<div class="wk-popup__actions">${link}</div>` : ``}
    </div>
  </div>`;
}

function clearFeedback(el){
  clearTimeout(feedbackTimer);
  if (el) el.style.display = "none";
}

function showFeedbackDelayed(el, text, delay = 600){
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    if (!el) return;
    el.textContent = text;
    el.style.display = "block";
  }, delay);
}

function getSpinner(){ return document.getElementById("loading-spinner"); }
function getBackdrop(){ return document.getElementById("loading-backdrop"); }
function showSpinner(){
  const s=getSpinner(), b=getBackdrop();
  if (b) b.classList.remove("hidden");
  if (s) s.classList.remove("hidden");
}
function hideSpinner(){
  const s=getSpinner(), b=getBackdrop();
  if (s) s.classList.add("hidden");
  if (b) b.classList.add("hidden");
}

function bounceOnce(el, height = 20, duration = 600) {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.animate(
    [
      { transform: `translateY(${-height}px)` },
      { transform: 'translateY(0)' },
      { transform: `translateY(${-height*0.5}px)` },
      { transform: 'translateY(0)' }
    ],
    { duration, easing: 'ease-out', composite: 'add' }
  );
}

export function setGeojsonLayer(layer) {
  geojsonLayerRef = layer;
}

export function showInfoPopup(map, message, latlng = null) {
  const overlay = document.getElementById("overlay-message");
  const text = document.getElementById("overlay-text");
  const close = document.getElementById("overlay-close");
  if (!overlay || !text || !close) {
    if (!latlng) latlng = map.getCenter();
    L.popup().setLatLng(latlng).setContent(message).openOn(map);
    return;
  }
  text.textContent = message;
  overlay.classList.remove("hidden");

  close.onclick = () => overlay.classList.add("hidden");

  const escHandler = (e) => { if (e.key === "Escape") { overlay.classList.add("hidden"); document.removeEventListener("keydown", escHandler); } };
  document.addEventListener("keydown", escHandler);

  setTimeout(() => close.focus(), 0);
}

export function clearMarkers(map) {
  if (marker) { map.removeLayer(marker); marker = null; }
  if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  map.closePopup();
}

export function enableLocationButton(map) {
  const button = document.getElementById("find-me");
  if (!button) return;
  button.onclick = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        if (marker) map.removeLayer(marker);
        let popupText = t("here_prefix");
        if (geojsonLayerRef) {
          const pt = turf.point([pos.coords.longitude, pos.coords.latitude]);
          let foundProps = null;
          geojsonLayerRef.eachLayer(layer => {
            if (foundProps) return; // Abbruch
            if (turf.booleanPointInPolygon(pt, layer.feature)) foundProps = layer.feature.properties;
          });
        popupText = foundProps
          ? `${t("here_prefix")}<br>` + buildWkDetails(foundProps)
          : `${t("here_prefix")}<br>${t("no_constituency")}`;
        }
        
        marker = L.marker(latlng).addTo(map).bindPopup(popupText).openPopup();
        const el = marker.getElement?.();
        bounceOnce(el, 20, 600);
        map.setView(latlng, 11);
      },
      () => showInfoPopup(map, t("error_location_fail"))
    );
  };
}

function fetchNominatim(query) {
  const lm = { gb: "en", de: "de", fr: "fr", dk: "da", pl: "pl" };
  const al = lm[getLang()] || "de";
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&viewbox=13.089,52.675,13.761,52.338&bounded=1&autocomplete=1&accept-language=${al}&countrycodes=de`;
  return fetch(url).then(res => res.json());
}

function filterToBW(data) {
  if (!geojsonLayerRef) return data;
  return data.filter(entry => {
    const lat = parseFloat(entry.lat);
    const lon = parseFloat(entry.lon);
    const pt = turf.point([lon, lat]);
    let inside = false;
    geojsonLayerRef.eachLayer(layer => {
      if (inside) return;
      if (turf.booleanPointInPolygon(pt, layer.feature)) inside = true;
    });
    return inside;
  });
}

function geocodeAddress(map, result) {
  const lat = parseFloat(result.lat);
  const lon = parseFloat(result.lon);

  if (searchMarker) map.removeLayer(searchMarker);

  let popupText = t("address_found");
  if (geojsonLayerRef) {
    const pt = turf.point([lon, lat]);
    let found = null;
      geojsonLayerRef.eachLayer(layer => {
        if (found) return; // Abbruch
        if (turf.booleanPointInPolygon(pt, layer.feature)) found = layer.feature.properties;
      });
    popupText = found
      ? `${t("address_found")}<br>` + buildWkDetails(found)
      : `${t("address_found")}<br>${t("no_constituency")}`;
  }

  searchMarker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup(popupText)
    .openPopup();

  bounceOnce(searchMarker.getElement?.(), 20, 600);
  map.setView([lat, lon], 11);
}

function geocodeAddressFromQuery(map, query, feedbackEl, afterSuccess, inputEl) {
  if (!query || query.trim().length < 3) return;
  showSpinner();
  clearFeedback(feedbackEl);
  const mySeq = ++reqSeq;
  fetchNominatim(query.trim()).then(data => {
    if (mySeq !== reqSeq) return;

    if (!data.length) {
      showFeedbackDelayed(feedbackEl, t("error_addr_not_found"));
      hideSpinner();
      return;
    }

    const filtered = filterToBW(data);
    if (!filtered.length) {
      showFeedbackDelayed(feedbackEl, t("error_addr_not_in_state"));
      hideSpinner();
      return;
    }

    clearFeedback(feedbackEl);
   
    geocodeAddress(map, filtered[0]);
    if (afterSuccess) afterSuccess();
    if (inputEl) inputEl.value = "";
    hideSpinner();
  })
  .catch(() => {
    hideSpinner();
    clearFeedback(feedbackEl);
    if (feedbackEl) {
      feedbackEl.textContent = t("error_network");
      feedbackEl.style.display = "block";
    }
    showInfoPopup(map, t("error_network_search"));
  });
}

function initAddressSearch(map, { mode, elements, closeFab }) {
  const { input, feedback, suggestions, clearBtn } = elements;
  if (!input) return;
  
  if (clearBtn) {
    clearBtn.addEventListener("click", () => clearMarkers(map));
  }

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      geocodeAddressFromQuery(map, input.value, feedback, () => { if (closeFab) closeFab(); }, input);
      if (mode === "popup" && suggestions) suggestions.style.display = "none";
    }
  });

  if (mode === "popup") {
    if (!suggestions) return;

  input.addEventListener("input", function () {
    const val = this.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (val.length < 3) {
        suggestions.style.display = "none";
        clearFeedback(feedback);
        return;
      }
        clearFeedback(feedback);
        showSpinner();
          const mySeq = ++reqSeq;               // << NEU
          fetchNominatim(val).then(data => {
            if (mySeq !== reqSeq) return; 
          suggestions.innerHTML = "";
  
          if (!data.length) {
            showFeedbackDelayed(feedback, t("error_addr_not_found"));
            suggestions.style.display = "none";
            hideSpinner();
            return;
          }
  
          const filtered = filterToBW(data);
          if (!filtered.length) {
            showFeedbackDelayed(feedback, t("error_addr_not_in_state"));
            suggestions.style.display = "none";
            hideSpinner();
            return;
          }
  
          filtered.forEach(entry => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "suggestion-item";
            item.textContent = entry.display_name;
            item.addEventListener("click", () => {
              showSpinner();
              input.value = entry.display_name;
              suggestions.style.display = "none";
              clearFeedback(feedback);
              geocodeAddress(map, entry);
              input.value = "";
              hideSpinner();
            });
            suggestions.appendChild(item);
          });
  
          suggestions.style.display = "block";
          hideSpinner();
  
          document.addEventListener("click", function handler(e) {
            if (!suggestions.contains(e.target) && e.target !== input) {
              suggestions.style.display = "none";
              clearFeedback(feedback);
              document.removeEventListener("click", handler);
            }
          });
        }).catch(() => {
          hideSpinner();
          clearFeedback(feedback);
          if (feedback) {
            feedback.textContent = t("error_network");
            feedback.style.display = "block";
          }
          suggestions.style.display = "none";
        });
    },200);
  });

  } else if (mode === "datalist") {
    const datalist = suggestions;
    input.addEventListener("input", function () {
      const val = this.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (val.length < 3 || !datalist) return;
          clearFeedback(feedback);
          showSpinner();
          fetchNominatim(val).then(data => {
            const filtered = filterToBW(data);
            datalist.innerHTML = "";
            filtered.forEach(entry => {
              const option = document.createElement("option");
              option.value = entry.display_name;
              datalist.appendChild(option);
            });
            hideSpinner();
          }).catch(() => {
            hideSpinner();
            clearFeedback(feedback);
            datalist.innerHTML = "";
            if (feedback) {
              feedback.textContent = t("error_network");
              feedback.style.display = "block";
            }
          });
      },200);
    });

    input.addEventListener("change", function () {
      const val = this.value.trim();
      if (val.length >= 3) {
        clearFeedback(feedback);
        geocodeAddressFromQuery(map, val, feedback, () => { if (closeFab) closeFab(); }, input);
        if (suggestions) suggestions.innerHTML = "";
      }
    });
  }
}

export function setupDesktopAutocomplete(map) {
  const input = document.getElementById("address-input");
  const feedback = document.getElementById("desktop-feedback");
  const suggestions = document.getElementById("address-suggestion-box");
  const clearBtn = document.getElementById('clear-marker');

  initAddressSearch(map, {
    mode: "popup",
    elements: { input, feedback, suggestions, clearBtn }
  });
}

export function setupFabAutocomplete(map) {
  const input = document.getElementById("fab-address-input");
  const feedback = document.getElementById("fab-feedback");
  const datalist = document.getElementById("fab-suggestions");
  const clearBtn = document.querySelector("#fab-address button");

  const fabMain = document.getElementById("fab-main");
  const fabMenu = document.getElementById("fab-menu");
  const closeFab = () => {
    if (fabMain && fabMenu) {
      fabMain.classList.remove("open");
      fabMenu.classList.remove("show");
    }
  };

  initAddressSearch(map, {
    mode: "datalist",
    elements: { input, feedback, suggestions: datalist, clearBtn },
    closeFab
  });

  const locationBtn = document.querySelector("#fab-location button");
  if (locationBtn) {
    locationBtn.addEventListener("click", () => {
      document.getElementById("find-me")?.click();
      closeFab();
    });
  }
}
