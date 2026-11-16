# Physiotherapie Faro — Interaktive 3D Praxiswebsite

High-End 3D-Webauftritt für **Physiotherapie Faro** (Nymphenburger Str. 20a, 80335 München Maxvorstadt · Leitung: Farhad Faro & Enayat Ahmad).

## Architektur & 3D-Features
- **Hero 3D Fluted Emerald Glass Shader (Three.js GLSL):** Echtzeit-Riffelglas-Refraktions-Shader mit volumetrischem Bloom und ruhiger 3D-Wirbelsäulen-Tiefe, kombiniert mit einem 5-teiligen gefächerten Perspektiv-Kartenfächer.
- **Single-Context Scissor 3D Anatomical Cards:** Vier spezialisierte Behandlungskarten (*Manuelle Therapie*, *Krankengymnastik*, *Kiefergelenktherapie CMD*, *Sportreha & Lymphdrainage*) gerendert über einen gemeinsamen WebGL-Kontext mit PMREM-Studio-Softbox-Umgebungsmap und `PCFSoftShadowMap`-Bodenschatten.
- **Interaktiver 3D Körper- & Therapie-Explorer:** Frei drehbare 3D-Körperachse (360° Drag-Orbit), benutzerdefinierter GLSL-Fresnel-Rim-Shader auf dem transluzenten Anatomie-Torso, bikondyläre Kniegelenk-Anatomie, drei Ansichtsmodi (*Wirbelsäule*, *Gelenkfokus*, *Faszienkette*) und dynamische 3D-zu-2D-Hotspot-Linien.
- **Praxis- & Datenschutz-Funktionen:** Therapiefokus-Orientierungsrechner, barrierefreies FAQ-Akkordeon, Zwei-Klick-Google-Maps-Vorschau mit monochromer Maxvorstadt-Vektorkarte sowie Impressum- (§ 5 DDG) und Datenschutz-Modals.

## Lokal starten
```bash
npx serve .
```

## Cook-Build-Metriken (ehrlich gemessen / dokumentiert)
- **Zeitrahmen:** ~42 Minuten (innerhalb eines 2h Hard Caps) über 8 dokumentierte Cook-Runden (`r01`–`r08`).
- **Stills & Critics:** 8 Render-Runden, Headless-Chrome-SwiftShader-Captures + Dual-Zero-Context-Critics + Python Color-Checks & automatisierte Interaktionstests (`0` Console-/Page-Errors, `375px` Mobile Zero-Overflow).
- **Quellen & Credits:** Prozedurale 3D-Geometrie & GLSL-Shader in Three.js r164; GSAP 3.12.5, Lenis 1.0.42, SplitType 0.3.4, Tailwind CSS CDN, Google Fonts (`Outfit` & `Plus Jakarta Sans`); KI-generierte Beispielbilder (`assets/images/therapy-*.jpg`, `clinic-interior.jpg`).
- **Prompt:** Siehe [docs/PROMPT.md](docs/PROMPT.md).
