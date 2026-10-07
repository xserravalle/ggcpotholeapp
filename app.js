const CAMPUS = {
  name: "Georgia Gwinnett College",
  lat: 33.9798,
  lng: -84.0017,
};

const RADIUS_MILES = 1;
const RADIUS_METERS = RADIUS_MILES * 1609.34;
const STORAGE_KEY = "ggc-potholes-v1";
const THEME_KEY = "ggc-a11y-theme";
const FONT_KEY = "ggc-a11y-font-size";
const AUTHORITY_EMAIL = "511@dot.ga.gov";

const FONT_SIZES = {
  small: "15px",
  normal: "18px",
  large: "22px",
  huge: "26px",
};

const SEVERITY_CONFIG = {
  high: { symbol: "▲", label: "High", speechLabel: "High priority hazard" },
  medium: { symbol: "◆", label: "Medium", speechLabel: "Medium severity notice" },
  low: { symbol: "●", label: "Low", speechLabel: "Low severity minor dip" },
};

const SEED_POTHOLES = [
  {
    id: "seed-1",
    lat: 33.9821,
    lng: -84.0048,
    locationName: "Collins Hill Rd (Right Lane)",
    severity: "high",
    notes: "Deep hole in the right lane near Collins Hill Rd.",
    source: "known",
  },
  {
    id: "seed-2",
    lat: 33.9774,
    lng: -84.0002,
    locationName: "Campus Loop Entrance",
    severity: "medium",
    notes: "Broken asphalt at the campus loop entrance.",
    source: "known",
  },
  {
    id: "seed-3",
    lat: 33.9809,
    lng: -83.9959,
    locationName: "University Center Lane",
    severity: "low",
    notes: "Shallow dip on University Center Lane.",
    source: "known",
  },
];

/* ==========================================================================
   Map & Marker Setup
   ========================================================================== */
const map = L.map("map").setView([CAMPUS.lat, CAMPUS.lng], 14);

let currentTileLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS, TomTom",
  }
).addTo(map);

// Campus center pin
L.marker([CAMPUS.lat, CAMPUS.lng])
  .addTo(map)
  .bindPopup(`<strong>🏫 ${CAMPUS.name}</strong><br>Center point of 1-mile search area.`);

// Radius circle
const searchCircle = L.circle([CAMPUS.lat, CAMPUS.lng], {
  radius: RADIUS_METERS,
  color: "#0f3e30",
  weight: 3,
  fillColor: "#0072b2",
  fillOpacity: 0.12,
}).addTo(map);

const markers = new Map();
let pendingLatLng = null;

/* ==========================================================================
   Distance, Location & Storage Utilities
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function milesBetween(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getDirectionFromCampus(lat, lng) {
  const dLat = lat - CAMPUS.lat;
  const dLng = lng - CAMPUS.lng;
  const dist = milesBetween(CAMPUS, { lat, lng }).toFixed(2);
  let dir = "";
  if (dLat > 0.001) dir += "North";
  else if (dLat < -0.001) dir += "South";
  if (dLng > 0.001) dir += dir ? "east" : "East";
  else if (dLng < -0.001) dir += dir ? "west" : "West";
  return dir ? `${dist} mi ${dir} of Campus` : `Near Main Campus`;
}

function getLocationDisplayName(item) {
  if (item.locationName && item.locationName.trim()) {
    return item.locationName.trim();
  }
  return getDirectionFromCampus(item.lat, item.lng);
}

function loadPotholes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let list = SEED_POTHOLES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [...SEED_POTHOLES];
    }
  }

  // Ensure locationName exists on each item (migrates older records)
  let updated = false;
  list = list.map((item) => {
    if (!item.locationName) {
      updated = true;
      if (item.id === "seed-1") item.locationName = "Collins Hill Rd (Right Lane)";
      else if (item.id === "seed-2") item.locationName = "Campus Loop Entrance";
      else if (item.id === "seed-3") item.locationName = "University Center Lane";
      else item.locationName = getDirectionFromCampus(item.lat, item.lng);
    }
    return item;
  });

  if (updated) savePotholes(list);
  return list;
}

function savePotholes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function formatCoords(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/* ==========================================================================
   Typography & Accessibility Customization Controls
   ========================================================================== */
function initAccessibilityControls() {
  // Font Size
  const savedFont = localStorage.getItem(FONT_KEY) || "normal";
  applyFontSize(savedFont);

  ["small", "normal", "large", "huge"].forEach((size) => {
    const btn = document.getElementById(`font-${size}`);
    if (btn) {
      btn.addEventListener("click", () => applyFontSize(size));
    }
  });

  // Themes
  const savedTheme = localStorage.getItem(THEME_KEY) || "colorblind";
  applyTheme(savedTheme);

  const themeBtn = document.getElementById("theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", cycleTheme);
  }
}

function applyFontSize(sizeKey) {
  const px = FONT_SIZES[sizeKey] || FONT_SIZES.normal;
  document.documentElement.style.setProperty("--app-font-size", px);
  localStorage.setItem(FONT_KEY, sizeKey);

  ["small", "normal", "large", "huge"].forEach((s) => {
    const btn = document.getElementById(`font-${s}`);
    if (btn) {
      btn.classList.toggle("active", s === sizeKey);
      btn.setAttribute("aria-pressed", s === sizeKey ? "true" : "false");
    }
  });
}

const THEMES = [
  { id: "colorblind", label: "Colorblind-Safe", circleColor: "#00669e", circleFill: "#56b4e9" },
  { id: "high-contrast", label: "High Contrast", circleColor: "#ffffff", circleFill: "#ffff00" },
  { id: "standard", label: "Standard (GGC)", circleColor: "#006747", circleFill: "#c4a35a" },
];

function applyTheme(themeId) {
  const current = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute("data-theme", current.id);
  localStorage.setItem(THEME_KEY, current.id);

  const label = document.getElementById("theme-label");
  if (label) label.textContent = current.label;

  // Update map boundary styling to match theme
  searchCircle.setStyle({
    color: current.circleColor,
    fillColor: current.circleFill,
  });

  // Re-sync markers to update styling
  sync(loadPotholes());
}

function cycleTheme() {
  const currentId = document.documentElement.getAttribute("data-theme") || "colorblind";
  const currentIndex = THEMES.findIndex((t) => t.id === currentId);
  const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
  applyTheme(nextTheme.id);
}

/* ==========================================================================
   Text-to-Speech (TTS) Voice Engine (Accessible / Elderly-Paced)
   ========================================================================== */
let activeUtterance = null;

function isSpeechSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function setSpeakingState(isSpeaking) {
  const stopBtn = document.getElementById("tts-stop-btn");
  if (stopBtn) {
    stopBtn.style.display = isSpeaking ? "inline-flex" : "none";
  }
}

function stopSpeaking() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
  setSpeakingState(false);
}

function speakText(text, onComplete) {
  if (!isSpeechSupported()) {
    alert("Text-to-speech is not supported in this web browser.");
    return;
  }

  stopSpeaking();

  // Make sure every playback finishes with a friendly southern "y'all!"
  let southernText = text.trim();
  if (!southernText.toLowerCase().endsWith("y'all!") && !southernText.toLowerCase().endsWith("y'all.")) {
    southernText += " ... y'all!";
  }

  const utterance = new SpeechSynthesisUtterance(southernText);
  // Relaxed southern drawl cadence
  utterance.rate = 0.84;
  utterance.pitch = 0.95;
  utterance.lang = "en-US";

  // Attempt to select a natural US English voice if available
  const voices = window.speechSynthesis.getVoices();
  const usVoice = voices.find(
    (v) => (v.lang === "en-US" || v.lang === "en_US") && !v.name.includes("Google")
  ) || voices.find((v) => v.lang.startsWith("en"));
  if (usVoice) {
    utterance.voice = usVoice;
  }

  utterance.onstart = () => {
    activeUtterance = utterance;
    setSpeakingState(true);
  };

  utterance.onend = () => {
    activeUtterance = null;
    setSpeakingState(false);
    if (onComplete) onComplete();
  };

  utterance.onerror = () => {
    activeUtterance = null;
    setSpeakingState(false);
  };

  window.speechSynthesis.speak(utterance);
}

function speakSummary() {
  const list = loadPotholes();
  const highCount = list.filter((p) => p.severity === "high").length;
  const medCount = list.filter((p) => p.severity === "medium").length;
  const lowCount = list.filter((p) => p.severity === "low").length;

  let speech = `Well howdy y'all! GGC Pothole Assistant checkin' in. We're keepin' an eye on potholes within a 1-mile radius of campus. `;
  speech += `There're currently ${list.length} potholes on record: `;
  speech += `${highCount} high severity, ${medCount} medium severity, and ${lowCount} low severity. `;

  if (highCount > 0) {
    const urgent = list.find((p) => p.severity === "high");
    const loc = getLocationDisplayName(urgent);
    const dist = milesBetween(CAMPUS, urgent).toFixed(2);
    speech += `Now y'all take extra caution: the most urgent hazard is right over on ${loc}, about ${dist} miles down the road from campus. Notes say: ${urgent.notes || "No notes provided"}. `;
  } else {
    speech += `Good news: no urgent high-severity potholes recorded right now. `;
  }

  speech += `Y'all can click the listen button on any card to hear the details, or tap generate report to send 'em on over to GDOT. Y'all drive safe now, y'all!`;

  speakText(speech);
}

function speakPothole(item) {
  const conf = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
  const loc = getLocationDisplayName(item);
  const dist = milesBetween(CAMPUS, item).toFixed(2);
  const speech = `Well howdy! ${conf.speechLabel} over on ${loc}, about ${dist} miles from campus. Notes say: ${item.notes || "No extra notes entered"}. Y'all watch out for that one now, y'all!`;
  speakText(speech);
}

/* ==========================================================================
   Report Builder
   ========================================================================== */
function buildReport(list) {
  const now = new Date().toLocaleString();
  const lines = [
    "==================================================",
    "        GGC AREA ACCESSIBLE POTHOLE REPORT        ",
    "==================================================",
    `Generated: ${now}`,
    `Center: ${CAMPUS.name} (${formatCoords(CAMPUS.lat, CAMPUS.lng)})`,
    `Coverage Radius: ${RADIUS_MILES} mile`,
    `Total Potholes Count: ${list.length}`,
    "--------------------------------------------------",
    "",
  ];

  list.forEach((item, index) => {
    const miles = milesBetween(CAMPUS, item).toFixed(2);
    const conf = SEVERITY_CONFIG[item.severity] || { symbol: "●", label: item.severity.toUpperCase() };
    const loc = getLocationDisplayName(item);
    lines.push(
      `[${index + 1}] ${conf.symbol} ${conf.label.toUpperCase()} SEVERITY`,
      `    Road / Landmark: ${loc}`,
      `    GPS Coordinates: ${formatCoords(item.lat, item.lng)}`,
      `    Distance from campus: ${miles} miles`,
      `    Reported Source: ${item.source}`,
      `    Description: ${item.notes || "(none)"}`,
      ""
    );
  });

  lines.push(
    "--------------------------------------------------",
    "Prototype notice: this report is generated by a student accessibility prototype.",
    "Please verify locations before dispatching road maintenance crews."
  );

  return lines.join("\n");
}

/* ==========================================================================
   Rendering Pothole Cards & Accessible Map Pins
   ========================================================================== */
function createCustomPin(severity) {
  const conf = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  return L.divIcon({
    className: "custom-pin-wrapper",
    html: `<div class="custom-map-pin pin-${severity}" aria-label="${conf.label} pothole marker">${conf.symbol}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function renderList(list) {
  const ul = document.getElementById("pothole-list");
  const count = document.getElementById("count-label");
  count.textContent = `${list.length} location${list.length === 1 ? "" : "s"} within 1 mile`;
  ul.innerHTML = "";

  list.forEach((item, index) => {
    const conf = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
    const dist = milesBetween(CAMPUS, item).toFixed(2);
    const loc = getLocationDisplayName(item);
    const li = document.createElement("li");
    li.className = "pothole-card";

    li.innerHTML = `
      <div class="card-header">
        <div>
          <span class="location-name-text">${index + 1}. ${escapeHtml(loc)}</span>
          <div class="distance-subtext">
            📍 ${dist} mi from campus &bull; <span class="gps-subtext" title="GPS Coordinates for maintenance crew">GPS: ${formatCoords(item.lat, item.lng)}</span>
          </div>
        </div>
        <span class="severity-badge ${item.severity}">
          <span aria-hidden="true">${conf.symbol}</span> ${conf.label}
        </span>
      </div>
      <p class="card-notes">${escapeHtml(item.notes) || "<em>No notes provided</em>"}</p>
      <div class="card-actions">
        <button type="button" class="card-speak-btn" aria-label="Listen to pothole on ${escapeHtml(loc)} aloud">
          <span aria-hidden="true">🔊</span> Listen
        </button>
      </div>
    `;

    // Listen audio button
    const speakBtn = li.querySelector(".card-speak-btn");
    speakBtn.addEventListener("click", () => speakPothole(item));

    // Remove button if user reported
    if (item.source === "user") {
      const actionsDiv = li.querySelector(".card-actions");
      const remove = document.createElement("button");
      remove.className = "card-remove-btn";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove pothole at ${escapeHtml(loc)}`);
      remove.textContent = "🗑 Remove";
      remove.addEventListener("click", () => {
        const next = loadPotholes().filter((p) => p.id !== item.id);
        savePotholes(next);
        sync(next);
      });
      actionsDiv.appendChild(remove);
    }

    ul.appendChild(li);
  });
}

function popupHtml(item) {
  const conf = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
  const dist = milesBetween(CAMPUS, item).toFixed(2);
  const loc = getLocationDisplayName(item);
  return `
    <div style="font-family: var(--font-family); font-size: 1.05em; line-height: 1.45; padding: 4px;">
      <strong style="font-size: 1.2em; display: block; margin-bottom: 3px;">${escapeHtml(loc)}</strong>
      <div style="margin-bottom: 5px;">
        <span class="severity-badge ${item.severity}" style="font-size: 0.85em; padding: 2px 8px;">
          ${conf.symbol} ${conf.label} Severity
        </span>
      </div>
      <strong>Distance:</strong> ${dist} mi from GGC<br>
      <strong>Notes:</strong> ${escapeHtml(item.notes) || "None"}<br>
      <small style="color: var(--text-secondary); opacity: 0.85;">GPS: ${formatCoords(item.lat, item.lng)}</small>
    </div>
  `;
}

function sync(list) {
  markers.forEach((marker) => marker.remove());
  markers.clear();

  list.forEach((item) => {
    const icon = createCustomPin(item.severity);
    const marker = L.marker([item.lat, item.lng], {
      icon: icon,
      draggable: item.source === "user",
    }).addTo(map);

    marker.bindPopup(popupHtml(item));

    if (item.source === "user") {
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        if (milesBetween(CAMPUS, { lat, lng }) > RADIUS_MILES) {
          marker.setLatLng([item.lat, item.lng]);
          alert("Please keep pothole reports inside the 1-mile campus circle.");
          return;
        }
        const next = loadPotholes().map((p) =>
          p.id === item.id ? { ...p, lat, lng } : p
        );
        savePotholes(next);
        sync(next);
      });
    }
    markers.set(item.id, marker);
  });

  renderList(list);
}

/* ==========================================================================
   Dialog & Interaction Handlers
   ========================================================================== */
function openAddDialog(latlng) {
  pendingLatLng = latlng;
  document.getElementById("add-coords").textContent = `📍 GPS: ${formatCoords(
    latlng.lat,
    latlng.lng
  )} (recorded for GDOT)`;

  const locationInput = document.getElementById("location-input");
  const fallback = getDirectionFromCampus(latlng.lat, latlng.lng);
  locationInput.value = "";
  locationInput.placeholder = "Detecting road name…";

  // Reverse geocode via Nominatim to pre-fill street/landmark name
  fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=17`
  )
    .then((res) => res.json())
    .then((data) => {
      const addr = data.address || {};
      const road =
        addr.road ||
        addr.pedestrian ||
        addr.cycleway ||
        addr.neighbourhood ||
        addr.amenity ||
        data.name ||
        "";
      if (locationInput && !locationInput.value) {
        locationInput.value = road ? road : fallback;
      }
    })
    .catch(() => {
      if (locationInput && !locationInput.value) {
        locationInput.value = fallback;
      }
    });

  document.getElementById("add-dialog").showModal();
}

map.on("click", (event) => {
  if (milesBetween(CAMPUS, event.latlng) > RADIUS_MILES) {
    alert("That point is outside the 1-mile GGC area. Please select a spot within the circle.");
    return;
  }
  openAddDialog(event.latlng);
});

document.getElementById("cancel-add").addEventListener("click", () => {
  document.getElementById("add-dialog").close();
  pendingLatLng = null;
});

document.getElementById("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!pendingLatLng) return;
  const form = event.target;
  const next = loadPotholes();
  const enteredLoc =
    form.locationName.value.trim() ||
    getDirectionFromCampus(pendingLatLng.lat, pendingLatLng.lng);

  next.push({
    id: `user-${Date.now()}`,
    lat: pendingLatLng.lat,
    lng: pendingLatLng.lng,
    locationName: enteredLoc,
    severity: form.severity.value,
    notes: form.notes.value.trim(),
    source: "user",
  });
  savePotholes(next);
  sync(next);
  form.reset();
  pendingLatLng = null;
  document.getElementById("add-dialog").close();
});

// Summary TTS Button
document.getElementById("tts-summary-btn").addEventListener("click", speakSummary);
document.getElementById("tts-stop-btn").addEventListener("click", stopSpeaking);

// Dialog full report TTS button
document.getElementById("tts-report-btn").addEventListener("click", () => {
  const text = buildReport(loadPotholes());
  speakText(text);
});

document.getElementById("generate-report").addEventListener("click", () => {
  document.getElementById("report-text").textContent = buildReport(loadPotholes());
  document.getElementById("report-dialog").showModal();
});

document.getElementById("download-report").addEventListener("click", () => {
  const text = buildReport(loadPotholes());
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ggc-pothole-report.txt";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("send-report").addEventListener("click", () => {
  const text = buildReport(loadPotholes());
  const subject = encodeURIComponent("GGC area pothole report (accessible student prototype)");
  const body = encodeURIComponent(text);
  window.location.href = `mailto:${AUTHORITY_EMAIL}?subject=${subject}&body=${body}`;
});

/* ==========================================================================
   Initialization
   ========================================================================== */
initAccessibilityControls();
sync(loadPotholes());

