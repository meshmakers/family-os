# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FamilyOS — a family organizer running fully on OctoMesh. Read `README.md`
first: it has the architecture, install story, developer workflow, the
client↔pipeline wire contract and the platform gotchas. This file only adds
the non-obvious bits.

## Commands

```bash
# CK model: compile + publish to the workspace-local CK catalog
dotnet build FamilyOs.sln -c DebugL

# Frontend
cd app/client
npm install        # first-time setup
npm run dev        # dev server at http://localhost:5173 (proxies /api → localhost:5020)
npm run build      # tsc + vite build → dist/
```

Pipeline iteration + deployment commands: see README.md "Developer workflow".

## Architecture

- **Backend = pipeline YAML.** There is no service code. The 16 HTTP
  pipelines live embedded in `blueprint/FamilyOs.{MainLatest,Release}/seed-data/entities.yaml`
  (source of truth for installs; the two variants differ ONLY in the
  Application's HelmRepository association 003 vs 005) and
  `test/dataflow-test.yaml` (scratch copy for iteration, 0fa9… rtIds, plus a
  probe pipeline). Keep all three in sync.
- **Own Helm chart** `src/charts/family-os-app` (adapted from
  one-time-ticket-app): contract is env `PORT`+`UPSTREAM_URL`, port 5055,
  probes on `GET /`; `image.tag` defaults to the chart `appVersion`, which CI
  sets to the image build number — never pin tags in blueprints. Blueprint
  1.0.0 used the property-walker chart with an image override; ≥ 1.0.1 uses
  family-os-app (needs the chart published to the dev channel by CI first).
- **State: Zustand store** (`app/client/src/store/useFamilyStore.ts`) — same
  interface as the original localStorage app, but `hydrate()` loads
  `GET /api/state` on boot and every action fires its API call alongside the
  optimistic local `set()`. `toggleTask` reconciles scores from the server
  response; sticker computation stays client-side and persists via
  `POST /household/stickers`.
- **API mapping** lives in `app/client/src/api.ts` — enum name/int-key
  mapping, date-key normalization, sticker sentinel. Change the wire contract
  only in lockstep with the pipelines.
- **Score booking is server-side** (fam-toggle-task): Math@1 nodes book
  ±points on the household, including the floor(pts/2) split for Both-tasks
  without a completer (delta − delta%2)/2 — works for both signs with C#
  truncated modulo.
- **Stable rtIds**: blueprint entities use the 0fa0… range (DataFlow 01,
  pipelines 02–11, Application 20, Household 30, categories 31–33); the
  scratch dataflow mirrors them under 0fa9….

## Conventions

- `Person` values in the UI stay `'mama' | 'papa' | 'both'`; the API layer
  maps to CK enum names/keys. Do not leak wire values into components.
- Entity ids are server-generated 24-hex rtId strings.
- `pendingToasts` is ephemeral (never persisted); sync failures push a toast.
- The CK model is versioned and immutable per version — see README gotcha #1
  before changing any attribute.
- Every CK attribute declares its ownership (AB#6327): `ck/FamilyOs.csproj` sets
  `OctoEnforceRuntimeStateMarkers=true`, so `dotnet build` fails with `OCTO-CK001`
  when an attribute in `ck/ConstructionKit/attributes/*.yaml` has no `ownership`
  (or the deprecated `isRuntimeState`). All 25 attributes restate today's
  behaviour with `ownership: SeedOwned` (FamilyOs stays 1.2.0). The `Household`
  and `CalendarCategory` attributes carry "ownership under review in AB#6328
  (audit F10)": the blueprint seeds those entities, so a seed version bump can
  reset names and scores; that decision is taken in AB#6328, not here. Review
  question for a new attribute: could a user type this value in the app? Yes →
  `TenantOwned`; the pipelines write it → `RuntimeState`; the blueprint ships
  it → `SeedOwned`.

## Live state (tenant `familyos`, local kind cluster `kind`, 2026-07-21)

| Thing | Id / location |
|---|---|
| Blueprint installed | `FamilyOs.MainLatest-1.0.0` (LocalFileSystemBlueprintCatalog) |
| DataFlow "FamilyOS API" | `0fa000000000000000000001` |
| Application "FamilyOS App" | `0fa000000000000000000020` |
| Household / categories | `0fa000000000000000000030` / `…31 …32 …33` |
| Mesh Adapter (System.Communication seed) | `670000000000000000000002` |
| App URL (kind ingress) | `https://familyos-familyos.127.0.0.1.nip.io` |
| App image | `meshmakers/family-os-app:0.1.0` (+ docker.mm.cloud tag, kind-loaded) |
