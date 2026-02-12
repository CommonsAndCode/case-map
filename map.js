import {
  setGeojsonLayer,
  enableLocationButton,
  setupDesktopAutocomplete,
  setupFabAutocomplete,
  showInfoPopup,
  setDataMaps,
  clearMarkers
} from './address.js';

let geojsonLayer = null;
let bezirkLayer = null;

const startZoom = window.innerWidth <= 768 ? 10 : 11;
const map = L.map('map', {
  minZoom: 6,
  maxZoom: 18,
  maxBounds: [
    [52.20, 12.60],
    [52.85, 14.20]
  ],
  maxBoundsViscosity: 0.5
}).setView([52.5200, 13.4050], startZoom);

const lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap-Mitwirkende'
});

const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 19
});

let currentTileLayer;
const attrTheme = document.documentElement.getAttribute('data-theme');
const initialTheme = localStorage.getItem('theme') || attrTheme || 'light';
currentTileLayer = initialTheme === 'dark' ? darkTileLayer : lightTileLayer;
currentTileLayer.addTo(map);

updateVH();
window.addEventListener('resize', updateVH);
if (window.visualViewport) {
  visualViewport.addEventListener('resize', updateVH);
  visualViewport.addEventListener('scroll', updateVH);
  window.addEventListener('orientationchange', updateVH);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) setTimeout(updateVH, 60);
  });
  setTimeout(updateVH, 60);
}

function updateVH() {
  const vv = window.visualViewport;
  let h = (vv && Number.isFinite(vv.height) && vv.height > 0) ? vv.height : window.innerHeight;
  if (!h || h < 200) h = window.innerHeight;
  const top = (vv && Number.isFinite(vv.offsetTop)) ? vv.offsetTop : 0;
  const vh = h * 0.01;
  const root = document.documentElement;
  root.style.setProperty('--vh', `${vh}px`);
  const mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.style.height = `calc(var(--vh, 1vh) * 100)`;
    mapEl.style.transform = `translate3d(0, ${top}px, 0)`;
  }

  if (typeof map?.invalidateSize === 'function') {
    requestAnimationFrame(() => map.invalidateSize(false));
  }
}

L.Control.ResetView = L.Control.extend({
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', '', container);
    button.innerHTML = '🗺️';
    button.href = '#';
    button.title = 'Zur Ausgangsposition (r)';
    button.setAttribute('aria-label', 'Zur Ausgangsposition (r)');
    button.dataset.i18nKey = 'reset_title';
    Object.assign(button.style, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '23px',
      width: '40px',
      height: '40px',
      textDecoration: 'none'
    });
    button.onclick = e => {
      e.preventDefault();
      map.setView([52.5200, 13.4050], startZoom);
    };
    return container;
  },
});

L.control.resetView = opts => new L.Control.ResetView(opts);
L.control.resetView({ position: 'topleft' }).addTo(map);

L.Control.DarkmodeToggle = L.Control.extend({
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', '', container);
    button.innerHTML = '🌗';
    button.href = '#';
    button.title = 'Darkmode umschalten (d)';
    button.setAttribute('aria-label', 'Darkmode umschalten (d)');
    button.dataset.i18nKey = 'dark_title';
    Object.assign(button.style, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '23px',
      width: '40px',
      height: '40px',
      textDecoration: 'none'
    });
    button.onclick = e => {
      e.preventDefault();
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      if (window.updateLogo) window.updateLogo(next);
      map.removeLayer(currentTileLayer);
      currentTileLayer = next === 'dark' ? darkTileLayer : lightTileLayer;
      currentTileLayer.addTo(map);
    };
    return container;
  },
});

L.control.darkmodeToggle = opts => new L.Control.DarkmodeToggle(opts);
L.control.darkmodeToggle({ position: 'topleft' }).addTo(map);

let colorBlindMode = false;
const normalGradient = 'linear-gradient(to right, rgb(231,76,60), rgb(241,196,15), rgb(46,204,113))';
const colorblindGradient = 'linear-gradient(to right, rgb(230,245,255), rgb(8,48,107))';

window.clearMarker = () => {
  clearMarkers(map);

  const fabMain = document.getElementById("fab-main");
  const fabMenu = document.getElementById("fab-menu");
  if (fabMain && fabMenu) {
    fabMain.classList.remove("open");
    fabMenu.classList.remove("show");
  }

  document.getElementById('desktop-feedback')?.style?.setProperty('display','none');
  document.getElementById('address-suggestion-box')?.style?.setProperty('display','none');
  const di = document.getElementById('address-input'); if (di) di.value = '';
  const fi = document.getElementById('fab-address-input'); if (fi) fi.value = '';
  const ff = document.getElementById('fab-feedback'); if (ff) ff.style.display = 'none';
  const dl = document.getElementById('fab-suggestions'); if (dl) dl.innerHTML = '';
};

const WK_DROPDOWN_LABEL = {
  "0101": "0101 – Bezirk Mitte (Wahlkreis 1)",
  "0102": "0102 – Bezirk Mitte (Wahlkreis 2)",
  "0103": "0103 – Bezirk Mitte (Wahlkreis 3)",
  "0104": "0104 – Bezirk Mitte (Wahlkreis 4)",
  "0105": "0105 – Bezirk Mitte (Wahlkreis 5)",
  "0106": "0106 – Bezirk Mitte (Wahlkreis 6)",
  "0107": "0107 – Bezirk Mitte (Wahlkreis 7)",

  "0201": "0201 – Bezirk Friedrichshain-Kreuzberg (Wahlkreis 1)",
  "0202": "0202 – Bezirk Friedrichshain-Kreuzberg (Wahlkreis 2)",
  "0203": "0203 – Bezirk Friedrichshain-Kreuzberg (Wahlkreis 3)",
  "0204": "0204 – Bezirk Friedrichshain-Kreuzberg (Wahlkreis 4)",
  "0205": "0205 – Bezirk Friedrichshain-Kreuzberg (Wahlkreis 5)",

  "0301": "0301 – Bezirk Pankow (Wahlkreis 1)",
  "0302": "0302 – Bezirk Pankow (Wahlkreis 2)",
  "0303": "0303 – Bezirk Pankow (Wahlkreis 3)",
  "0304": "0304 – Bezirk Pankow (Wahlkreis 4)",
  "0305": "0305 – Bezirk Pankow (Wahlkreis 5)",
  "0306": "0306 – Bezirk Pankow (Wahlkreis 6)",
  "0307": "0307 – Bezirk Pankow (Wahlkreis 7)",
  "0308": "0308 – Bezirk Pankow (Wahlkreis 8)",
  "0309": "0309 – Bezirk Pankow (Wahlkreis 9)",

  "0401": "0401 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 1)",
  "0402": "0402 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 2)",
  "0403": "0403 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 3)",
  "0404": "0404 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 4)",
  "0405": "0405 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 5)",
  "0406": "0406 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 6)",
  "0407": "0407 – Bezirk Charlottenburg-Wilmersdorf (Wahlkreis 7)",

  "0501": "0501 – Bezirk Spandau (Wahlkreis 1)",
  "0502": "0502 – Bezirk Spandau (Wahlkreis 2)",
  "0503": "0503 – Bezirk Spandau (Wahlkreis 3)",
  "0504": "0504 – Bezirk Spandau (Wahlkreis 4)",
  "0505": "0505 – Bezirk Spandau (Wahlkreis 5)",

  "0601": "0601 – Bezirk Steglitz-Zehlendorf (Wahlkreis 1)",
  "0602": "0602 – Bezirk Steglitz-Zehlendorf (Wahlkreis 2)",
  "0603": "0603 – Bezirk Steglitz-Zehlendorf (Wahlkreis 3)",
  "0604": "0604 – Bezirk Steglitz-Zehlendorf (Wahlkreis 4)",
  "0605": "0605 – Bezirk Steglitz-Zehlendorf (Wahlkreis 5)",
  "0606": "0606 – Bezirk Steglitz-Zehlendorf (Wahlkreis 6)",
  "0607": "0607 – Bezirk Steglitz-Zehlendorf (Wahlkreis 7)",

  "0701": "0701 – Bezirk Tempelhof-Schöneberg (Wahlkreis 1)",
  "0702": "0702 – Bezirk Tempelhof-Schöneberg (Wahlkreis 2)",
  "0703": "0703 – Bezirk Tempelhof-Schöneberg (Wahlkreis 3)",
  "0704": "0704 – Bezirk Tempelhof-Schöneberg (Wahlkreis 4)",
  "0705": "0705 – Bezirk Tempelhof-Schöneberg (Wahlkreis 5)",
  "0706": "0706 – Bezirk Tempelhof-Schöneberg (Wahlkreis 6)",
  "0707": "0707 – Bezirk Tempelhof-Schöneberg (Wahlkreis 7)",

  "0801": "0801 – Bezirk Neukölln (Wahlkreis 1)",
  "0802": "0802 – Bezirk Neukölln (Wahlkreis 2)",
  "0803": "0803 – Bezirk Neukölln (Wahlkreis 3)",
  "0804": "0804 – Bezirk Neukölln (Wahlkreis 4)",
  "0805": "0805 – Bezirk Neukölln (Wahlkreis 5)",
  "0806": "0806 – Bezirk Neukölln (Wahlkreis 6)",

  "0901": "0901 – Bezirk Treptow-Köpenick (Wahlkreis 1)",
  "0902": "0902 – Bezirk Treptow-Köpenick (Wahlkreis 2)",
  "0903": "0903 – Bezirk Treptow-Köpenick (Wahlkreis 3)",
  "0904": "0904 – Bezirk Treptow-Köpenick (Wahlkreis 4)",
  "0905": "0905 – Bezirk Treptow-Köpenick (Wahlkreis 5)",
  "0906": "0906 – Bezirk Treptow-Köpenick (Wahlkreis 6)",
  "0907": "0907 – Bezirk Treptow-Köpenick (Wahlkreis 7)",

  "1001": "1001 – Bezirk Marzahn-Hellersdorf (Wahlkreis 1)",
  "1002": "1002 – Bezirk Marzahn-Hellersdorf (Wahlkreis 2)",
  "1003": "1003 – Bezirk Marzahn-Hellersdorf (Wahlkreis 3)",
  "1004": "1004 – Bezirk Marzahn-Hellersdorf (Wahlkreis 4)",
  "1005": "1005 – Bezirk Marzahn-Hellersdorf (Wahlkreis 5)",
  "1006": "1006 – Bezirk Marzahn-Hellersdorf (Wahlkreis 6)",

  "1101": "1101 – Bezirk Lichtenberg (Wahlkreis 1)",
  "1102": "1102 – Bezirk Lichtenberg (Wahlkreis 2)",
  "1103": "1103 – Bezirk Lichtenberg (Wahlkreis 3)",
  "1104": "1104 – Bezirk Lichtenberg (Wahlkreis 4)",
  "1105": "1105 – Bezirk Lichtenberg (Wahlkreis 5)",
  "1106": "1106 – Bezirk Lichtenberg (Wahlkreis 6)",

  "1201": "1201 – Bezirk Reinickendorf (Wahlkreis 1)",
  "1202": "1202 – Bezirk Reinickendorf (Wahlkreis 2)",
  "1203": "1203 – Bezirk Reinickendorf (Wahlkreis 3)",
  "1204": "1204 – Bezirk Reinickendorf (Wahlkreis 4)",
  "1205": "1205 – Bezirk Reinickendorf (Wahlkreis 5)",
  "1206": "1206 – Bezirk Reinickendorf (Wahlkreis 6)",
};

L.Control.ColorblindToggle = L.Control.extend({
  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', '', container);
    button.innerHTML = '🎨';
    button.href = '#';
    button.title = 'Farbschema umschalten (Farbenblind-Modus) (c)';
    button.setAttribute('aria-label', 'Farbschema umschalten (Farbenblind-Modus) (c)');
    button.dataset.i18nKey = 'cb_title';
    Object.assign(button.style, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '23px',
      width: '40px',
      height: '40px',
      textDecoration: 'none'
    });

    button.onclick = e => {
      e.preventDefault();
      colorBlindMode = !colorBlindMode;
      if (geojsonLayer) applyRenderMode(map, geojsonLayer, colorForLayer);
      updateLegendGradient();
    };

    return container;
  }
});

L.control.colorblindToggle = opts => new L.Control.ColorblindToggle(opts);
L.control.colorblindToggle({ position: 'topleft' }).addTo(map);

let outlineOn = false;

const _langSeq = [
  { code: "de", label: "Sprache ändern (a)" },
  { code: "gb", label: "Change language (a)" },
  { code: "fr", label: "Changer la langue (a)" },
  { code: "dk", label: "Skift sprog (a)" },
  { code: "pl", label: "Zmień język (a)" }
];
let _langIndex = 0;
let _langButtonEl = null;

function _flagImgHTML(cc) {
  return `<img class="flag-icon" alt="" src="./flags/flag_${cc}.jpg?v=2">`;
}

function getInitialLang(){
  const nav = (navigator.language || "de").toLowerCase();
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("da")) return "dk";
  if (nav.startsWith("pl")) return "pl";
  return "gb";
}

function getLang(){ return localStorage.getItem("lang") || "de"; }

function _setLangButtonState(btn){
  const { code, label } = _langSeq[_langIndex];
  btn.innerHTML = _flagImgHTML(code);
  btn.title = label;
  btn.setAttribute("aria-label", label);
}

function _cycleLang(btn){
  _langIndex = (_langIndex + 1) % _langSeq.length;
  const nextCode = _langSeq[_langIndex].code;
  _setLangButtonState(btn);
  setLang(nextCode);
}

const wahlkreisLayerMap = new Map();

const I18N = {
  de: {
    reset_title: "Zur Ausgangsposition (r)",
    dark_title: "Darkmode umschalten (d)",
    cb_title: "Farbschema umschalten (Farbenblind-Modus) (c)",
    outline_title: "Konturenmodus (o)",
    btn_findme: "📍 Wo bin ich",
    filter_placeholder: "🔎 Wahlkreis auswählen",
    search_label: "Adresse eingeben",
    search_ph: "Adresse (Straße, Ort, PLZ)",
    btn_clear: "Markierung entfernen",
    legend_h: "Unterschriften",
    legend_sub: "Grün = Ziel erreicht",
    legend_goal: "Ziel: 60 pro Wahlkreis · 220 pro Bezirk · 2500 Landesliste",
    legend_why: "Warum? Unterstützungsunterschriften sind gesetzlich nötig, damit Volt auf dem Wahlzettel steht.",
    legend_stand_prefix: "Stand:",
    more_info: "Mehr Infos",
    uu_kontakt: "Unterschriften-Kontakt",
    web_feedback: "Webseite-Feedback",
    fab_findme: "📍 Wo bin ich",
    fab_clear: "Markierung entfernen",
    fab_search_ph: "Adresse (Straße, Ort, PLZ)",
    fab_legend_h: "Unterschriften",
    fab_legend_sub: "Grün = Ziel erreicht",
    fab_legend_scale0: "0",
    fab_legend_scale100: "30",
    fab_legend_scale200: "60",
    imprint:"Impressum",
    privacy:"Datenschutz",
    no_cookies:"Keine Cookies. Keine Datenspeicherung.",
    landesliste_label: "Landesliste",
    landesliste_detail: "Für die Landesliste benötigen wir zusätzlich Unterschriften. Ziel: 2500",
    landesliste_deadline_prefix: "🗓️ Frist:",
    sr_lang_changed: "Sprache geändert: Deutsch",
    pct_reached_suffix: "Prozent erreicht",
    error_addr_not_found: "Adresse nicht gefunden. Bitte Schreibweise prüfen oder vollständige Adresse eingeben.",
    error_addr_not_in_state: "Adresse liegt nicht in Berlin. Bitte Schreibweise prüfen oder vollständige Adresse eingeben.",
    error_network: "Netzwerkfehler. Prüfe deine Verbindung.",
    error_network_search: "Netzwerkfehler bei der Adresssuche. Bist du offline?",
    error_location_fail: "Standort konnte nicht ermittelt werden.",
    error_offline: "Du bist offline – aktuelle Daten und Suche stehen nicht zur Verfügung.",
    info_online: "Wieder online.",
    error_data_load: "Daten konnten nicht geladen werden. Bist du offline?",
    here_prefix: "Du bist hier",
    address_found: "Adresse gefunden",
    no_constituency: "Keinem Wahlkreis zugeordnet.",
    wk_label: "Wahlkreis",
    signatures_label: "Unterschriften",
    candidate_label: "Direktkandidat*in",
    no_direct_candidate: "Keine Direktkandidatur in diesem Wahlkreis",
    more_info_label: "Mehr Infos",
    rotate_msg: "Bitte Smartphone im Hochformat benutzen.",
    bvv_label: "BVV-Unterschriften"
  },
  gb: {
    reset_title: "Reset view (r)",
    dark_title: "Toggle dark mode (d)",
    cb_title: "Toggle colorblind scheme (c)",
    outline_title: "Outline mode (o)",
    btn_findme: "📍 Locate me",
    filter_placeholder: "🔎 Select constituency",
    search_label: "Enter address",
    search_ph: "Address (street, city, ZIP)",
    btn_clear: "Clear marker",
    legend_h: "Signatures",
    legend_sub: "Green = goal reached",
    legend_goal: "Target: 60 per constituency · 220 per district · 2,500 state list",
    legend_why: "Why? Signatures are legally required so Volt appears on the ballot.",
    legend_stand_prefix: "Updated:",
    more_info: "More info",
    uu_kontakt: "Signatures contact",
    web_feedback: "Website feedback",
    fab_findme: "📍 Locate me",
    fab_clear: "Clear marker",
    fab_search_ph: "Address (street, city, ZIP)",
    fab_legend_h: "Signatures",
    fab_legend_sub: "Green = goal reached",
    fab_legend_scale0: "0",
    fab_legend_scale100: "30",
    fab_legend_scale200: "60",
    imprint:"Imprint",
    privacy:"Privacy",
    no_cookies:"No cookies. No data storage.",
    landesliste_label: "State list",
    landesliste_detail: "We also need signatures for the state list. Goal: 2500",
    landesliste_deadline_prefix: "🗓️ Deadline:",
    sr_lang_changed: "Language changed: English",
    pct_reached_suffix: "percent reached",
    error_addr_not_found: "Address not found. Check spelling or enter a full address.",
    error_addr_not_in_state: "Address is not in Berlin. Check spelling or enter a full address.",
    error_network: "Network error. Check your connection.",
    error_network_search: "Network error during address search. Are you offline?",
    error_location_fail: "Location could not be determined.",
    error_offline: "You are offline – live data and search are unavailable.",
    info_online: "Back online.",
    error_data_load: "Data could not be loaded. Are you offline?",
    here_prefix: "You are here",
    address_found: "Address found",
    no_constituency: "Not assigned to any constituency.",
    wk_label: "Constituency",
    signatures_label: "Signatures",
    candidate_label: "Direct candidate",
    no_direct_candidate: "No direct candidate in this constituency",
    more_info_label: "More info",
    rotate_msg: "Please use your phone in portrait orientation.",
    bvv_label: "District (BVV) signatures"
  },
  fr: {
    reset_title: "Revenir à la vue initiale (r)",
    dark_title: "Activer le mode sombre (d)",
    cb_title: "Schéma daltonien (c)",
    outline_title: "Mode contours (o)",
    btn_findme: "📍 Me localiser",
    filter_placeholder: "🔎 Choisir la circonscription",
    search_label: "Saisir l’adresse",
    search_ph: "Adresse (rue, ville, CP)",
    btn_clear: "Effacer le repère",
    legend_h: "Signatures",
    legend_sub: "Vert = objectif atteint",
    legend_goal: "Objectif : 60 par circonscription électorale · 220 par district · 2500 liste régionale",
    legend_why: "Pourquoi ? Signatures légalement requises pour figurer sur le bulletin.",
    legend_stand_prefix: "Mise à jour :",
    more_info: "Plus d’infos",
    uu_kontakt: "Contact signatures",
    web_feedback: "Retour site web",
    fab_findme: "📍 Me localiser",
    fab_clear: "Effacer le repère",
    fab_search_ph: "Adresse (rue, ville, CP)",
    fab_legend_h: "Signatures",
    fab_legend_sub: "Vert = objectif atteint",
    fab_legend_scale0: "0",
    fab_legend_scale100: "30",
    fab_legend_scale200: "60",
    imprint:"Mentions légales",
    privacy:"Protection des données",
    no_cookies:"Pas de cookies. Pas de stockage de données.",
    landesliste_label: "Liste régionale",
    landesliste_detail: "Nous avons aussi besoin de signatures pour la liste régionale. Objectif : 2500",
    landesliste_deadline_prefix: "🗓️ Date limite :",
    sr_lang_changed: "Langue modifiée : français",
    pct_reached_suffix: "pour cent atteints",
    error_addr_not_found: "Adresse introuvable. Vérifiez l’orthographe ou saisissez l’adresse complète.",
    error_addr_not_in_state: "Adresse hors Berlin. Vérifiez l’orthographe ou saisissez l’adresse complète.",
    error_network: "Erreur réseau. Vérifiez votre connexion.",
    error_network_search: "Erreur réseau lors de la recherche d’adresse. Êtes-vous hors ligne ?",
    error_location_fail: "Impossible de déterminer votre position.",
    error_offline: "Hors ligne – données en direct et recherche indisponibles.",
    info_online: "De nouveau en ligne.",
    error_data_load: "Impossible de charger les données. Êtes-vous hors ligne ?",
    here_prefix: "Vous êtes ici",
    address_found: "Adresse trouvée",
    no_constituency: "Non attribué à une circonscription.",
    wk_label: "Circonscription",
    signatures_label: "Signatures",
    candidate_label: "Candidat·e direct·e",
    no_direct_candidate: "Aucune candidature directe dans cette circonscription",
    more_info_label: "Plus d’infos",
    rotate_msg: "Veuillez utiliser votre smartphone en orientation portrait.",
    bvv_label: "Signatures du district (BVV)"
  },
  dk: {
    reset_title: "Nulstil visning (r)",
    dark_title: "Skift mørk tilstand (d)",
    cb_title: "Farveblind-tilstand (c)",
    outline_title: "Konturtilstand (o)",
    btn_findme: "📍 Hvor er jeg",
    filter_placeholder: "🔎 Vælg kreds",
    search_label: "Indtast adresse",
    search_ph: "Adresse (vej, by, postnr.)",
    btn_clear: "Fjern markør",
    legend_h: "Underskrifter",
    legend_sub: "Grøn = mål nået",
    legend_goal: "Mål: 60 pr. valgkreds · 220 pr. distrikt · 2500 landsliste",
    legend_why: "Hvorfor? Underskrifter kræves lovpligtigt for at komme på stemmesedlen.",
    legend_stand_prefix: "Opdateret:",
    more_info: "Flere oplysninger",
    uu_kontakt: "Kontakt underskrifter",
    web_feedback: "Webfeedback",
    fab_findme: "📍 Hvor er jeg",
    fab_clear: "Fjern markør",
    fab_search_ph: "Adresse (vej, by, postnr.)",
    fab_legend_h: "Underskrifter",
    fab_legend_sub: "Grøn = mål nået",
    fab_legend_scale0: "0",
    fab_legend_scale100: "30",
    fab_legend_scale200: "60",
    imprint:"Impressum",
    privacy:"Privatliv",
    no_cookies:"Ingen cookies. Ingen datalagring.",
    landesliste_label: "Landsliste",
    landesliste_detail: "Vi har også brug for underskrifter til landslisten. Mål: 2500",
    landesliste_deadline_prefix: "🗓️ Frist:",
    sr_lang_changed: "Sprog ændret: dansk",
    pct_reached_suffix: "procent nået",
    error_addr_not_found: "Adresse blev ikke fundet. Kontroller stavning eller indtast en fuld adresse.",
    error_addr_not_in_state: "Adressen ligger ikke i Berlin. Kontroller stavning eller indtast en fuld adresse.",
    error_network: "Netværksfejl. Tjek din forbindelse.",
    error_network_search: "Netværksfejl under adresse-søgning. Er du offline?",
    error_location_fail: "Placering kunne ikke bestemmes.",
    error_offline: "Du er offline – live data og søgning er ikke tilgængelige.",
    info_online: "Online igen.",
    error_data_load: "Data kunne ikke indlæses. Er du offline?",
    here_prefix: "Du er her",
    address_found: "Adresse fundet",
    no_constituency: "Ikke tilknyttet nogen kreds.",
    wk_label: "Kreds",
    signatures_label: "Underskrifter",
    candidate_label: "Direkte kandidat",
    no_direct_candidate: "Ingen direkte kandidat i denne kreds",
    more_info_label: "Flere oplysninger",
    rotate_msg: "Brug venligst din telefon i stående format.",
    bvv_label: "Distrikt (BVV) underskrifter"
  },
  pl: {
    reset_title: "Resetuj widok (r)",
    dark_title: "Przełącz tryb ciemny (d)",
    cb_title: "Tryb daltonistyczny (c)",
    outline_title: "Tryb konturów (o)",
    btn_findme: "📍 Gdzie jestem",
    filter_placeholder: "🔎 Wybierz okręg",
    search_label: "Wpisz adres",
    search_ph: "Adres (ulica, miasto, kod)",
    btn_clear: "Usuń znacznik",
    legend_h: "Podpisy",
    legend_sub: "Zielony = cel osiągnięty",
    legend_goal: "Cel: 60 na okręg wyborczy · 220 na okręg · 2500 na listę krajową",
    legend_why: "Dlaczego? Podpisy są wymagane prawnie, aby Volt był na karcie do głosowania.",
    legend_stand_prefix: "Aktualizacja:",
    more_info: "Więcej informacji",
    uu_kontakt: "Kontakt ws. podpisów",
    web_feedback: "Opinie o stronie",
    fab_findme: "📍 Gdzie jestem",
    fab_clear: "Usuń znacznik",
    fab_search_ph: "Adres (ulica, miasto, kod)",
    fab_legend_h: "Podpisy",
    fab_legend_sub: "Zielony = cel osiągnięty",
    fab_legend_scale0: "0",
    fab_legend_scale100: "30",
    fab_legend_scale200: "60",
    imprint:"Dane wydawcy",
    privacy:"Polityka prywatności",
    no_cookies:"Brak ciasteczek. Brak przechowywania danych.",
    landesliste_label: "Lista krajowa",
    landesliste_detail: "Potrzebujemy też podpisów na listę krajową. Cel: 2500",
    landesliste_deadline_prefix: "🗓️ Termin:",
    sr_lang_changed: "Zmieniono język: polski",
    pct_reached_suffix: "procent osiągnięte",
    error_addr_not_found: "Nie znaleziono adresu. Sprawdź pisownię lub wpisz pełny adres.",
    error_addr_not_in_state: "Adres nie leży w Berlin. Sprawdź pisownię lub wpisz pełny adres.",
    error_network: "Błąd sieci. Sprawdź połączenie.",
    error_network_search: "Błąd sieci podczas wyszukiwania adresu. Czy jesteś offline?",
    error_location_fail: "Nie można ustalić lokalizacji.",
    error_offline: "Jesteś offline — dane na żywo i wyszukiwanie są niedostępne.",
    info_online: "Ponownie online.",
    error_data_load: "Nie można wczytać danych. Czy jesteś offline?",
    here_prefix: "Jesteś tutaj",
    address_found: "Adres znaleziony",
    no_constituency: "Nieprzypisany do żadnego okręgu.",
    wk_label: "Okręg",
    signatures_label: "Podpisy",
    candidate_label: "Kandydat bezpośredni",
    no_direct_candidate: "Brak kandydata bezpośredniego w tym okręgu",
    more_info_label: "Więcej informacji",
    rotate_msg: "Proszę używać telefonu w orientacji pionowej.",
    bvv_label: "Podpisy okręgu (BVV)"
  }
};

const unterschriftenMap = Object.create(null);
const kandidatMap = Object.create(null);
const linkMap = Object.create(null);
const bezirkUnterschriftenMap = Object.create(null);
const wkGesammeltMap = Object.create(null);
const bezirkGesammeltMap = Object.create(null);
window.I18N = I18N;

function setLang(langCode){
  const lang = I18N[langCode] ? langCode : "de";
  localStorage.setItem("lang", lang);
  document.documentElement.setAttribute("lang", lang === "gb" ? "en" : lang);

  document.querySelectorAll('.leaflet-bar a[data-i18n-key]').forEach(a => {
    const key = a.dataset.i18nKey;
    const txt = I18N[lang]?.[key];
    if (txt) { a.title = txt; a.setAttribute('aria-label', txt); }
  });

  const q = (id) => document.getElementById(id);
  const setText = (id, text) => { const el=q(id); if (el) el.textContent = text; };
  const setPlaceholder = (id, text) => { const el=q(id); if (el) el.placeholder = text; };

  setText("find-me", I18N[lang].btn_findme);
  setText("rotate-msg", I18N[lang].rotate_msg);

  const filter = q("wahlkreis-filter");
  if (filter && filter.options?.length){
    filter.options[0].textContent = I18N[lang].filter_placeholder;
  }
  
  setText("legend-title", I18N[lang].legend_h);
  const legendH3 = document.querySelector(".legend h3");
  if (legendH3) legendH3.textContent = I18N[lang].legend_h;

  const legendSub = document.querySelector(".legend .legend-sub");
  if (legendSub) legendSub.textContent = I18N[lang].legend_sub;

  const facts = document.querySelector(".legend-facts");
  if (facts){
    const ps = facts.querySelectorAll("p");
    if (ps[0]) ps[0].innerHTML = `<strong>${I18N[lang].legend_goal.split(":")[0]}:</strong> ${I18N[lang].legend_goal.split(":").slice(1).join(":").trim()}`;
    if (ps[1]) ps[1].textContent = I18N[lang].legend_why;
  }

  const fabFacts = document.querySelector("#fab-legend .legend-facts");
  if (fabFacts){
    const ps = fabFacts.querySelectorAll("p");
    if (ps[0]) ps[0].innerHTML = `<strong>${I18N[lang].legend_goal.split(":")[0]}:</strong> ${I18N[lang].legend_goal.split(":").slice(1).join(":").trim()}`;
    if (ps[1]) ps[1].textContent = I18N[lang].legend_why;
  }
  
  const ts = document.getElementById("timestamp");
  if (ts && ts.textContent) ts.textContent = ts.textContent.replace(/^(.+?):/, I18N[lang].legend_stand_prefix);
  
  const fts = document.getElementById("fab-timestamp");
  if (fts && fts.textContent) fts.textContent = fts.textContent.replace(/^(.+?):/, I18N[lang].legend_stand_prefix);
  
  const links = document.querySelector(".legend-links");
  if (links){
    const a = links.querySelectorAll("a");
    if (a[0]) a[0].textContent = I18N[lang].more_info;
    if (a[1]) a[1].textContent = I18N[lang].uu_kontakt;
    if (a[2]) a[2].textContent = I18N[lang].web_feedback;
  }

  const llShort = document.getElementById("landesliste-short");
  if (llShort) {
    const m = llShort.textContent.match(/:\s*(.+)$/);
    const current = m ? m[1].trim() : "";
    if (current) llShort.textContent = `${I18N[lang].landesliste_label} (bestätigt): ${current}`;
  }
  
  const llDetail = document.getElementById("landesliste-detail");
  if (llDetail) llDetail.textContent = I18N[lang].landesliste_detail;
  
  const dl = document.getElementById("landesliste-deadline");
  if (dl && dl.textContent) {
    dl.textContent = dl.textContent.replace(/^🗓️\s*[^:]+:/, I18N[lang].landesliste_deadline_prefix);
    dl.setAttribute("aria-label", dl.textContent);
  }
  
  const footerLinks = document.querySelector(".footer-links");
  if (footerLinks){
    const a = footerLinks.querySelectorAll("a");
    if (a[0]) a[0].textContent = I18N[lang].imprint;
    if (a[1]) a[1].textContent = I18N[lang].privacy;
  }

  const footNote = document.querySelector(".footer-note");
  if (footNote) footNote.textContent = I18N[lang].no_cookies;

  const lbl = document.querySelector(`#search-box label[for="address-input"]`);
  if (lbl) lbl.textContent = I18N[lang].search_label;
  setPlaceholder("address-input", I18N[lang].search_ph);
  setText("clear-marker", I18N[lang].btn_clear);

  const fabFindBtn = document.querySelector("#fab-location button");
  if (fabFindBtn) fabFindBtn.textContent = I18N[lang].fab_findme;

  const fabClearBtn = document.querySelector("#fab-address button");
  if (fabClearBtn) fabClearBtn.textContent = I18N[lang].fab_clear;

  const fabInput = q("fab-address-input");
  if (fabInput) fabInput.placeholder = I18N[lang].fab_search_ph;

  const fabLegend = q("fab-legend");
  if (fabLegend){
    const h3 = fabLegend.querySelector("h3");
    const sub = fabLegend.querySelector(".legend-sub");
    const scale = fabLegend.querySelector(".flex-between");
    if (h3) h3.textContent = I18N[lang].fab_legend_h;
    if (sub) sub.textContent = I18N[lang].fab_legend_sub;
    if (scale){
      const spans = scale.querySelectorAll("span");
      if (spans[0]) spans[0].textContent = I18N[lang].fab_legend_scale0;
      if (spans[1]) spans[1].textContent = I18N[lang].fab_legend_scale100;
      if (spans[2]) spans[2].textContent = I18N[lang].fab_legend_scale200;
    }
    
    const fabLinks = fabLegend.querySelectorAll(".legend-links a");
    if (fabLinks[0]) fabLinks[0].textContent = I18N[lang].more_info;
    if (fabLinks[1]) fabLinks[1].textContent = I18N[lang].uu_kontakt;
    if (fabLinks[2]) fabLinks[2].textContent = I18N[lang].web_feedback;
  }
    const live = document.getElementById("sr-live");
    if (live) live.textContent = I18N[lang].sr_lang_changed || "";

    wahlkreisLayerMap.forEach((layer) => {
      const props = layer.feature?.properties || {};
      const nr = wkNr(props);
      const name = wkDisplayNameFromNr(nr);
      const wkBest = unterschriftenMap[nr] || "0";
      const wkGes  = wkGesammeltMap[nr] || "0";
      const bezirk = wkBezirkFromNr(nr);
      const bBest = bezirkUnterschriftenMap[bezirk] ?? "0";
      const bGes  = bezirkGesammeltMap[bezirk] ?? "0";
    
      const kandidat = kandidatMap[nr] || null;
      const lang = getLang();
      const kandidatText = kandidat ? kandidat : I18N[lang].no_direct_candidate;
    
      const more = I18N[lang].more_info_label;
      const link = linkMap[nr] ? `<a href="${linkMap[nr]}" target="_blank" rel="noopener">${more}</a>` : "";
    
      const html =
        `${I18N[lang].wk_label} ${nr}: ${name}<br>` +
        `Wahlkreis gesammelt: ${wkGes}<br>` +
        `Wahlkreis bestätigt: ${wkBest}<br>` +
        `Bezirk gesammelt: ${bGes}<br>` +
        `Bezirk bestätigt: ${bBest}<br>` +
        `${I18N[lang].candidate_label}: ${kandidatText}<br>` +
        `${link}`;
    
      const wasOpen = typeof layer.isPopupOpen === 'function' ? layer.isPopupOpen() : false;
      const popup = layer.getPopup && layer.getPopup();
      if (popup) popup.setContent(html);
      else layer.bindPopup(html);
    
      if (wasOpen) {
        if (layer._wkAnchor) layer.openPopup(layer._wkAnchor);
        else layer.openPopup();
      }
    });
          
    if (bezirkLayer) {
      bezirkLayer.eachLayer((bzLayer) => {
        const bezirk = String(bzLayer.feature?.properties?.bezirk ?? "").padStart(2, "0");
        const bBest = bezirkUnterschriftenMap[bezirk] ?? "0";
        const bGes  = bezirkGesammeltMap[bezirk] ?? "0";
        const html = `Bezirk ${bezirk}<br>Gesammelt: ${bGes}<br>Bestätigt: ${bBest}`;
    
        const t = (typeof bzLayer.getTooltip === "function") ? bzLayer.getTooltip() : null;
        if (t) t.setContent(html);
      });
    }
  }
function wkNr(p = {}) {
  return String(p.WKNR ?? p.Nummer ?? "")
    .replace(/\D/g, "")
    .padStart(4, "0");
}

L.Control.OutlineToggle = L.Control.extend({
  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', '', container);
    button.innerHTML = '👓';
    button.href = '#';
    button.title = 'Konturenmodus (o)';
    button.setAttribute('aria-label', 'Konturenmodus (o)');
    button.dataset.i18nKey = 'outline_title';
    Object.assign(button.style, {
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '23px', width: '40px', height: '40px', textDecoration: 'none'
    });
    button.onclick = e => {
      e.preventDefault();
      if (!geojsonLayer) return;
      outlineOn = !outlineOn;
      setRenderMode(outlineOn ? RENDER_MODES.GHOST : RENDER_MODES.NORMAL);
      applyRenderMode(map, geojsonLayer, colorForLayer);
    };
    return container;
  }
});

L.Control.LanguageToggle = L.Control.extend({
  onAdd: function () {
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', '', container);
    button.href = '#';
    Object.assign(button.style, {
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontSize: '23px', width: '40px', height: '40px', textDecoration: 'none'
    });

    const start = getInitialLang();
    const idx = _langSeq.findIndex(x => x.code === start);
    _langIndex = idx >= 0 ? idx : 0;
    _setLangButtonState(button);
    setLang(_langSeq[_langIndex].code);

    button.onclick = e => { e.preventDefault(); _cycleLang(button); };
    _langButtonEl = button;
    return container;
  }
});

L.control.languageToggle = opts => new L.Control.LanguageToggle(opts);
L.control.outlineToggle = opts => new L.Control.OutlineToggle(opts);
L.control.outlineToggle({ position: 'topleft' }).addTo(map);
L.control.languageToggle({ position: 'topleft' }).addTo(map);

function updateLegendGradient() {
  const legendBars = document.querySelectorAll('.legend-bar');
  legendBars.forEach(bar => {
    bar.style.background = colorBlindMode ? colorblindGradient : normalGradient;
  });
  const legendDescription = document.getElementById('legend-description');
  const fabLegendDescription = document.getElementById('fab-legend-description');
  if (legendDescription) {
    legendDescription.textContent = colorBlindMode
      ? 'Farbe zeigt die bestätigten Unterschriften: Blau = Ziel erreicht.'
      : 'Farbe zeigt die bestätigten Unterschriften: Grün = Ziel erreicht.';
  }
  if (fabLegendDescription) {
    fabLegendDescription.textContent = colorBlindMode
      ? 'Blau = Ziel erreicht (60 je WK, dazu noch die Landesliste)'
      : 'Grün = Ziel erreicht (60 je WK, dazu noch die Landesliste)';
  }
}

function interpolateColorNormal(uu) {
  uu = Math.max(0, Math.min(uu, 60));
  let r, g, b;
  if (uu <= 30) {
    const t = uu / 30;
    r = Math.round(231 + (241 - 231) * t);
    g = Math.round(76 + (196 - 76) * t);
    b = Math.round(60 + (15 - 60) * t);
  } else {
    const t = (uu - 30) / 30;
    r = Math.round(241 + (46 - 241) * t);
    g = Math.round(196 + (204 - 196) * t);
    b = Math.round(15 + (113 - 15) * t);
  }
  return `rgb(${r},${g},${b})`;
}

function interpolateColorColorblind(uu) {
  uu = Math.max(0, Math.min(uu, 60));
  const t = uu / 60;
  const start = [230, 245, 255];
  const end = [8, 48, 107];
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function getColor(uu) {
  return colorBlindMode ? interpolateColorColorblind(uu) : interpolateColorNormal(uu);
}

function pickCell(row, keys){
  for (const k of keys) {
    const v = row?.[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

const colorForLayer = (layer) => {
  const nr = wkNr(layer.feature?.properties || {});
  if (!kandidatMap[nr]) return '#bdbdbd';
  return getColor(unterschriftenMap[nr] || 0);
};

function buildBezirkOutlines(geo, map) {
  const paneId = ensureBezirkPane(map);

  const groups = new Map();
  for (const f of (geo.features || [])) {
    const nr = String(f?.properties?.WKNR ?? f?.properties?.Nummer ?? "");
    const bezirk = wkBezirkFromNr(nr);
    if (!groups.has(bezirk)) groups.set(bezirk, []);
    groups.get(bezirk).push(f);
  }

  const dissolved = [];
  for (const [bezirk, feats] of groups.entries()) {
    let acc = null;

    const fc = turf.featureCollection(feats);
    turf.flattenEach(fc, (part) => {
      try { acc = acc ? turf.union(acc, part) : part; } catch (e) {}
    });

    if (acc) {
      acc.properties = { bezirk };
      dissolved.push(acc);
    }
  }

  if (bezirkLayer) {
    map.removeLayer(bezirkLayer);
    bezirkLayer = null;
  }

  bezirkLayer = L.geoJSON(turf.featureCollection(dissolved), {
    pane: paneId,
    interactive: true,
    style: () => ({
      color: "#000",
      weight: bezirkStrokeWeightForZoom(map.getZoom()),
      opacity: 1,
      fill: false,
      lineJoin: "round",
      lineCap: "round"
    }),
    onEachFeature: (feature, layer) => {
      const bezirk = String(feature?.properties?.bezirk ?? "").padStart(2, "0");
      const bBest = bezirkUnterschriftenMap[bezirk] ?? "0";
      const bGes  = bezirkGesammeltMap[bezirk] ?? "0";
      const html = `Bezirk ${bezirk}<br>Gesammelt: ${bGes}<br>Bestätigt: ${bBest}`;
  
      layer.bindTooltip(html, {
        sticky: true,
        direction: "top",
        className: "bezirk-tooltip"
      });
    }
  }).addTo(map);

  if (!map._bezirkZoomHandlerAttached) {
    map._bezirkZoomHandlerAttached = true;
    map.on("zoomend", () => {
      if (!bezirkLayer) return;
      bezirkLayer.setStyle({ weight: bezirkStrokeWeightForZoom(map.getZoom()) });
    });
  }
}

function toggleLandeslisteDetail() {
  const counter = document.getElementById("landesliste-counter");
  if (window.innerWidth <= 768) {
    counter.classList.toggle("tap-detail");
  }
}

const counter = document.getElementById("landesliste-counter");
if (counter) {
  counter.setAttribute("tabindex", "0");
  counter.setAttribute("role", "button");
  counter.setAttribute("aria-label", "Details zur Landesliste ein- oder ausklappen");
  counter.setAttribute("aria-describedby", "landesliste-short landesliste-detail landesliste-deadline");

  counter.addEventListener("click", toggleLandeslisteDetail);
  counter.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleLandeslisteDetail();
    }
  });
}

const fabMain = document.getElementById("fab-main");
const fabMenu = document.getElementById("fab-menu");

if (fabMain && fabMenu) {
  fabMain.addEventListener("click", () => {
    fabMain.classList.toggle("open");
    fabMenu.classList.toggle("show");
  });
}

const RENDER_MODES = { NORMAL: "normal", GHOST: "ghost" };
let _renderMode = RENDER_MODES.NORMAL;

function strokeWeightForZoom(zoom) {
  const z = Math.max(0, Math.min(22, zoom || 10));
  return +(0.8 + z * 0.19).toFixed(2);
}

function baseStyle({ stroke, weight, fillColor, fillOpacity }) {
  return {
    color: stroke, 
    fillColor, 
    weight,
    opacity: 1,
    fill: true,
    fillOpacity,
    lineJoin: "round",
    lineCap: "round"
  };
}

function styleForMode(mode, zoom, baseColor) {
  const w = strokeWeightForZoom(zoom);
  if (mode === RENDER_MODES.GHOST) {
    return baseStyle({ stroke: baseColor, weight: Math.max(1, w), fillColor: baseColor, fillOpacity: 0.1 });
  }
  return baseStyle({ stroke: "#000", weight: 1.2, fillColor: baseColor, fillOpacity: 0.7 });
}

function ensureOutlinePane(map) {
  const id = "wk-outline-pane";
  if (!map.getPane(id)) {
    map.createPane(id);
    map.getPane(id).style.zIndex = 410;
  }
  return id;
}

function wkBezirkFromNr(nrRaw) {
  const nr = String(nrRaw ?? "").replace(/\D/g, "").padStart(4, "0");
  return nr.slice(0, 2);
}

function ensureBezirkPane(map) {
  const id = "bezirk-outline-pane";
  if (!map.getPane(id)) {
    map.createPane(id);
    map.getPane(id).style.zIndex = 420;
    map.getPane(id).style.pointerEvents = "none";
  }
  return id;
}

function bezirkStrokeWeightForZoom(zoom) {
  const base = strokeWeightForZoom(zoom);
  return Math.max(1.6, base * 1.5);
}

function setRenderMode(mode) {
  if (Object.values(RENDER_MODES).includes(mode)) _renderMode = mode;
}

function applyRenderMode(map, geoJsonLayer, colorForLayer) {
  if (!map || !geoJsonLayer) return;
  const paneId = ensureOutlinePane(map);
  geoJsonLayer.eachLayer((layer) => {
    if (!layer.setStyle) return;
    layer.options.pane = paneId;
    const baseColor = colorForLayer ? colorForLayer(layer) : "#6a1b9a";
    layer.setStyle(styleForMode(_renderMode, map.getZoom(), baseColor));
  });
}

function attachRenderUpdater(map, geoJsonLayer, colorForLayer) {
  const update = () => applyRenderMode(map, geoJsonLayer, colorForLayer);
  map.on("zoomend", update);
  update();
  return () => map.off("zoomend", update);
}

function wkDisplayNameFromNr(nrRaw) {
  const nr = String(nrRaw ?? "").replace(/\D/g, "").padStart(4, "0");
  const bezirk = nr.slice(0, 2);
  const wk = nr.slice(2, 4);
  return `Bezirk ${bezirk} Wahlkreis ${wk}`;
}

function toInt(v){
  return parseInt(String(v ?? "").replace(/\D/g, ""), 10) || 0;
}
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
function pct(val, goal){
  const p = Math.round((toInt(val) / goal) * 100);
  return clamp(p, 0, 100);
}

function wkPopupHTML(props){
  const nr = wkNr(props);
  const name = wkDisplayNameFromNr(nr);

  const wkBest = unterschriftenMap[nr] || "0";
  const wkGes  = wkGesammeltMap[nr] || "0";

  const bezirk = wkBezirkFromNr(nr);
  const bBest = bezirkUnterschriftenMap[bezirk] ?? "0";
  const bGes  = bezirkGesammeltMap[bezirk] ?? "0";

  const WK_GOAL = 60;
  const BZ_GOAL = 220;

  const wkPct = pct(wkBest, WK_GOAL);
  const bzPct = pct(bBest, BZ_GOAL);

  const kandidat = kandidatMap[nr] || null;
  const lang = getLang();
  const kandidatText = kandidat ? kandidat : I18N[lang].no_direct_candidate;

  const more = I18N[lang].more_info_label;
  const link = linkMap[nr]
    ? `<a class="wk-link" href="${linkMap[nr]}" target="_blank" rel="noopener">${more}</a>`
    : "";

  return `
  <div class="wk-popup">
    <div class="wk-popup__head">
      <div class="wk-popup__title">${I18N[lang].wk_label} ${nr}</div>
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
        <span>${I18N[lang].candidate_label}:</span>
        <strong>${kandidatText}</strong>
      </div>
      ${link ? `<div class="wk-popup__actions">${link}</div>` : ``}
    </div>
  </div>`;
}

let landeslisteBest = "";
let landeslisteGes = "";

fetch("https://opensheet.elk.sh/1ze8AED85WWXm-SyXt5rx7iRv8bwLWz0UugcVoIGtkvU/Fuer Website_bitte nicht aendern")
  .then(res => res.json())
  .then(data => {
    data.forEach(row => {
      const wknr = String(row?.WKNR ?? "").trim();
      const specialVal = pickCell(row, ["Bestätigte-UU", "Bestaetigte-UU", "Gesammelte-UU", "Gesammelte UU", "Gesammelt-UU"]);
      const wkBest = pickCell(row, ["Bestätigte-UU", "Bestaetigte-UU"]);
      const wkGes  = pickCell(row, ["Gesammelte-UU", "Gesammelte UU", "Gesammelt-UU"]);
      const bezirk = pickCell(row, ["Bezirk"]).padStart(2, "0");
      const bezBest = pickCell(row, ["Best-Bez-UU"]);
      const bezGes  = pickCell(row, ["Ges-Bez-UU", "Gesammelt-Bezirk", "Ges-Bezirk"]);
      if (bezirk && /^\d{2}$/.test(bezirk)) {
        if (bezBest !== "") bezirkUnterschriftenMap[bezirk] = String(bezBest).trim();
        if (bezGes  !== "") bezirkGesammeltMap[bezirk] = String(bezGes).trim();
      }
      if (!wknr && !specialVal) return;
      if (wknr.toLowerCase().includes("aktualisierung")) {
        const text = `Stand: ${specialVal}`;
        const desktop = document.getElementById("timestamp");
        const fab = document.getElementById("fab-timestamp");
        if (desktop) desktop.textContent = text;
        if (fab) fab.textContent = text;
          } else if (wknr.toLowerCase().includes("bestätigt-landesliste") || wknr.toLowerCase().includes("bestaetigt-landesliste")) {
            const ll =
              Object.values(row)
                .map(v => String(v ?? "").trim())
                .filter(v => v && !/bestätigt-landesliste|bestaetigt-landesliste/i.test(v))
                .find(v => /\d/.test(v)) || "";
          
            if (!ll) return;
          
            landeslisteBest = ll;
          
            const llShort = document.getElementById("landesliste-short");
            if (llShort) llShort.textContent = `Landesliste (bestätigt): ${ll}`;
          
            const goal = 2500;
            const count = parseInt(ll.replace(/\D/g, ""), 10) || 0;
            const pct = Math.round((count / goal) * 100);
          
            const bar = document.getElementById("ll-progress-bar");
            const prog = document.getElementById("ll-progress");
            const label = document.getElementById("ll-progress-label");
          
            if (bar) bar.style.width = pct + "%";
            if (prog) {
              prog.setAttribute("aria-valuenow", String(pct));
              const lang = localStorage.getItem("lang") || "de";
              const suf = (I18N[lang]?.pct_reached_suffix) || "Prozent erreicht";
              prog.setAttribute("aria-valuetext", pct + " " + suf);
            }
            if (label) label.textContent = pct + "%";
          
          } else if (wknr.toLowerCase().includes("gesammelt-landesliste")) {
            const ll =
              Object.values(row)
                .map(v => String(v ?? "").trim())
                .filter(v => v && !/gesammelt-landesliste/i.test(v))
                .find(v => /\d/.test(v)) || "";
          
            if (!ll) return;
          
            landeslisteGes = ll;
          
            const el = document.getElementById("landesliste-collected");
            if (el) el.textContent = `Gesammelt: ${ll}`;
        
            const goal = 2500;
            const count = parseInt(ll.replace(/\D/g, ""), 10) || 0;
            const pct = Math.round((count / goal) * 100);
          
            const bar = document.getElementById("ll-progress-bar");
            const prog = document.getElementById("ll-progress");
            const label = document.getElementById("ll-progress-label");
            if (bar) bar.style.width = pct + "%";
            if (prog) {
              prog.setAttribute("aria-valuenow", String(pct));
              const lang = localStorage.getItem("lang") || "de";
              const suf = (I18N[lang]?.pct_reached_suffix) || "Prozent erreicht";
              prog.setAttribute("aria-valuetext", pct + " " + suf);
            }
            if (label) label.textContent = pct + "%";

        } else if (wknr.toLowerCase().includes("frist")) {
          const dl1 = document.getElementById("landesliste-deadline");
          if (dl1) {
            dl1.textContent = `🗓️ Frist: ${specialVal}`;
            dl1.setAttribute("aria-label", `Frist: ${specialVal}`);
          }
      } else {
        const key = wkNr({ WKNR: wknr });
        if (wkBest !== "") unterschriftenMap[key] = wkBest;
        if (wkGes  !== "") wkGesammeltMap[key] = wkGes;   
      
        const kandidat = pickCell(row, ["Direktkandidierende"]);
        const link = pickCell(row, ["Link zu UU Formular"]);
      
        if (kandidat) kandidatMap[key] = kandidat;
        if (link) linkMap[key] = link;
      }
    });
    
    setDataMaps({
      unterschriftenMap,
      wkGesammeltMap,
      bezirkUnterschriftenMap,
      bezirkGesammeltMap,
      kandidatMap,
      linkMap
    });

    fetch("data/AWK_AH2026.geojson")
      .then(res => res.json())
      .then(geo => {
        geojsonLayer = L.geoJSON(geo, {
            pane: ensureOutlinePane(map),
            style: feature => {
              const baseColor = colorForLayer({ feature });
              return styleForMode(_renderMode, map.getZoom(), baseColor);
            },
            onEachFeature: (feature, layer) => {
              const nr = wkNr(feature.properties);
            
              const popupHTML = wkPopupHTML(feature.properties);
              layer.bindPopup(popupHTML);
            
              wahlkreisLayerMap.set(nr, layer);
            
              let largestPoly;
              if (feature.geometry.type === "MultiPolygon") {
                const polys = feature.geometry.coordinates.map(rings => turf.polygon(rings));
                largestPoly = polys.reduce((a, b) => (turf.area(a) > turf.area(b) ? a : b));
              } else {
                largestPoly = turf.polygon(feature.geometry.coordinates);
              }
              const anchor = turf.pointOnFeature(largestPoly).geometry.coordinates;
              layer._wkAnchor = L.latLng(anchor[1], anchor[0]);
              const latlngRings = turf.getCoords(largestPoly).map(r => r.map(([lng,lat]) => [lat,lng]));
              layer._wkBounds = L.polygon(latlngRings).getBounds();
            
              layer.on({
                mouseover: e => {
                  e.target.setStyle({ weight: 4, color: '#000' });
                  e.target.bringToFront();
                },
                mouseout: e => {
                  geojsonLayer.resetStyle(e.target);
                }
              });
            
              const kandidat = kandidatMap[nr] || null;
              if (kandidat) {
                const coords = turf.centerOfMass(largestPoly).geometry.coordinates;
                const tooltip = L.tooltip({
                  permanent: true,
                  direction: 'center',
                  className: 'wahlkreis-tooltip'
                }).setContent(unterschriftenMap[nr] || "0")
                 .setLatLng([coords[1], coords[0]]);
                map.addLayer(tooltip);
              }
            }
        }).addTo(map);

        buildBezirkOutlines(geo, map);
        
        applyRenderMode(map, geojsonLayer, colorForLayer);
        attachRenderUpdater(map, geojsonLayer, colorForLayer);
        setGeojsonLayer(geojsonLayer);

        const sel = document.getElementById("wahlkreis-filter");
        if (sel) {
         const coll = new Intl.Collator("de", { numeric: true, sensitivity: "base" });
         const feats = Array.isArray(geo.features) ? [...geo.features] : [];
         feats
           .sort((a,b)=>coll.compare(
             String(a.properties.WKNR ?? a.properties.Nummer ?? ""),
             String(b.properties.WKNR ?? b.properties.Nummer ?? "")
           ))
           .forEach(f => {
             const nr = wkNr(f.properties);
             const name = f.properties.WKNAME ?? f.properties["WK Name"];
             const opt = document.createElement("option");
             opt.value = nr;
             opt.textContent = WK_DROPDOWN_LABEL[nr] ?? `WK ${nr}`;
             sel.appendChild(opt);
           });

         sel.addEventListener("change", function () {
           const layer = wahlkreisLayerMap.get(this.value);
           if (!layer) return;
           map.fitBounds(layer._wkBounds || layer.getBounds());
           if (layer._wkAnchor) { layer.openPopup(layer._wkAnchor); map.panTo(layer._wkAnchor); }
           else { layer.openPopup(); }
        });
      }
    })
      .catch(err => {
        console.error("Fehler beim Laden der GeoJSON:", err);
        const lang = getLang();
        showInfoPopup(map, I18N[lang].error_data_load);
      });
  })
  .catch(err => {
    console.error("Fehler beim Laden der Unterschriften-Daten:", err);
    const lang = getLang();
    showInfoPopup(map, I18N[lang].error_data_load);
  });

enableLocationButton(map);
setupDesktopAutocomplete(map);
setupFabAutocomplete(map);

if (!navigator.onLine) {
  const lang = getLang();
  showInfoPopup(map, I18N[lang].error_offline);
}

window.addEventListener("offline", () => {
  const lang = getLang();
  showInfoPopup(map, I18N[lang].error_offline);
});
window.addEventListener("online", () => {
  const lang = getLang();
  showInfoPopup(map, I18N[lang].info_online);
});

document.addEventListener("keydown", e => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  switch (e.key.toLowerCase()) {
    case "d":
      document.querySelector(".leaflet-bar a[data-i18n-key='dark_title']")?.click();
      break;
    case "c":
      document.querySelector(".leaflet-bar a[data-i18n-key='cb_title']")?.click();
      break;
    case "o":
      document.querySelector(".leaflet-bar a[data-i18n-key='outline_title']")?.click();
      break;
    case "a":
      if (_langButtonEl) _langButtonEl.click();
      break;
    case "r":
      map.setView([52.5200, 13.4050], startZoom);
      break;
    case "+":
      map.zoomIn();
      break;
    case "-":
      map.zoomOut();
      break;
    case "l":
      document.getElementById("find-me")?.click();
      break;
    case "s":
      document.getElementById("address-input")?.focus();
      break;
  }
});
