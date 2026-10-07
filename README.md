# GGC Pothole App — Look & Feel (Accessibility Edition)

This branch contains the standalone **Look & Feel Prototype** for the GGC Pothole Tracker, focused on maximum accessibility for vision-limited, colorblind, and elderly users.

---

## 🌟 Key Features & Accessibility Enhancements

1. **Comic Sans MS Typography**:
   - Universal Comic Sans MS styling for enhanced dyslexia and reading accessibility.
   - Dynamic font-size scaling controls (`A−`, `A`, `A+`, `A++`) with persistent browser memory (`localStorage`).

2. **Text-to-Speech (TTS) Voice Engine (with Southern Accent)**:
   - Web Speech API integration calibrated with a gentle, relaxed Southern cadence (`0.84x` rate).
   - "Read Overview" summary of potholes within 1 mile of campus.
   - Individual "Listen" audio button on every pothole card.
   - Every audio playback concludes with a friendly *"... y'all!"*.

3. **Road & Landmark Priority (Human-Centric Navigation)**:
   - Recognizable road and landmark names displayed prominently (e.g., *Collins Hill Rd*, *Campus Loop Entrance*).
   - GPS coordinates preserved as secondary metadata for GDOT maintenance crews.
   - Automatic reverse geocoding when clicking the map to report a pothole.

4. **Colorblind-Safe & High-Contrast Palettes (Dual-Coding)**:
   - **Colorblind-Safe (Default)**: Okabe-Ito / Color Universal Design palette (Vermilion orange, Sky blue, Bluish green).
   - **Dual-Coding**: Geometric symbols (`▲ High`, `◆ Medium`, `● Low`) on cards, popups, and custom map pins.
   - **High-Contrast Mode**: Stark B&W with bright yellow accents and inverted map tiles.
   - **Standard Mode**: Classic GGC Green and Gold.

5. **Minimalist & Decluttered UI**:
   - Spacious cards, breathable margins, and large 48px+ touch targets for effortless mobile & desktop interaction.
   - High-visibility keyboard focus outlines (`:focus-visible`).

6. **Reliable Map Tiles (No API Keys / No 403 Blocks)**:
   - Powered by ESRI ArcGIS World Street Map for reliable local `file:///` viewing without watermarks.

---

## 🚀 How to Run

Simply open `index.html` in any modern web browser! No build tools or dev server required.
