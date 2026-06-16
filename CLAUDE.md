# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # first-time setup
npm run dev        # dev server at http://localhost:5173
npm run build      # tsc + vite build → dist/
npm run preview    # serve the dist/ build locally
```

## Architecture

Single-page React + Vite app (TypeScript). No backend — all state persists to `localStorage` under the key `familyflow_v4`.

### State: Zustand store (`src/store/useFamilyStore.ts`)

All application state lives in one Zustand store with `persist` middleware. `partialize` controls what gets saved to localStorage — `pendingToasts` is intentionally excluded (ephemeral). `STICKER_DEFS` is exported from the same file and used by `GamePanel`.

When adding actions that should show a toast, append to `pendingToasts` inside the `set` callback. `Toast.tsx` watches the array and shifts items off after 2.8 s.

### Types (`src/types.ts`)

`Person = 'mama' | 'papa' | 'both'`, `DayAssignment = 'mama' | 'papa' | 'none'`. The calendar stores day data as `DaysMap = Record<dateKey, Record<catId, DayAssignment>>`.

### Custom SVG icons

`BagIcon` and `BikeIcon` are hand-drawn SVG React components in `src/components/icons/`. All icon rendering goes through `RenderIcon.tsx` which dispatches bag/bike to SVGs and everything else to emoji strings defined in `EMOJI_ICONS`.

### CSS

All styles are global classes in `src/index.css` (no CSS modules). Color tokens are CSS variables on `:root`. Mama = pink (`--pink-*`), Papa = blue (`--blue-*`). Adding a new color theme means adding variables and new `.s-*` / `.chip-*` / `.badge` variant classes.

### OctoMesh (planned)

When adding OctoMesh: replace the Zustand `persist` middleware with a custom storage adapter that syncs to the OctoMesh backend. The store interface in `useFamilyStore.ts` won't need to change — only the persistence layer. Each action (`addTask`, `toggleTask`, `addNote`, etc.) gets an API call alongside the local `set()`.
