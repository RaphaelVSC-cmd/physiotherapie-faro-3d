# Prompt

> Built from the user's intake and prompt in one continuous Cook session:

```text
/cook erstelle für das unternehmen eine perfekte high end 3d website: /goal
UNTERNEHMENS_DATEN: Physiotherapie Faro, Nymphenburger Str. 20a, München, +49 89 18914161, 5.0★ (26 Bewertungen), Physiotherapeut.
Aufgaben-Spezifikation: nur /cook (kein website-generator, kein website-audit-pro), cap 2h, default Referenzen/Bar/Regeln/Deliverable/Hardware, pushen auf Vercel ja und GitHub ja, kein Notion.
```

## Build Settings
- **Model:** Gemini 4 (High)
- **References:** 5 visual UI/3D direction references (`cook/refs/R01`–`R05`, kept local only)
- **Stack:** HTML5, Tailwind CSS (CDN), Three.js r164 (ES Module), GSAP + ScrollTrigger, Lenis, SplitType
- **Time cap:** 2 hours
