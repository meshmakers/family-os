# FamilyOS

A family organizer running **fully on OctoMesh**: tasks with a points/sticker
game, a shopping list, pinboard notes and a weekly calendar with per-day
Mama/Papa assignments.

The entire backend is declarative pipeline YAML executed by the tenant's stock
Mesh Adapter — **no service code**. The repo follows the
[one-time-ticket](../one-time-ticket/) pattern:

| OctoMesh capability | Where it shows up here |
|---|---|
| **Construction Kit / data model** | `FamilyOs` CK model — 6 types, 4 enums (`ck/ConstructionKit/`) |
| **Dataflows / pipelines** | 16 HTTP pipelines on the tenant's Mesh Adapter (state aggregation, task CRUD with server-side score booking via `Math@1`, shopping, notes, day upserts, household updates) |
| **Blueprints** | One `InstallBlueprint` seeds the CK model, the DataFlow + pipelines, the domain seeds (household singleton, default calendar categories) and the web-app workload |
| **Operator / deployments / apps** | The React SPA ships as an `Application` entity; the Communication Operator rolls it out as a Helm release with ingress (property-walker chart + image override) |

```
browser ── https://familyos-<tenant>.127.0.0.1.nip.io   (ingress, kind)
              │
              ▼
   FamilyOS App  (Application entity 0fa0…20, Helm-deployed by the operator)
   Node proxy + Vite-built SPA: /api/* ──► Mesh Adapter (in-cluster, :80/<tenant>)
                                              │  16 fam-* pipelines
                                              ▼
                                     FamilyOs/* entities (data mesh)
```

## Install story

Prerequisites on the tenant: communication enabled (`EnableCommunication`
seeds Pool `670…001`, Mesh Adapter `670…002`, dev Helm repo `670…003`), the
pool deployed (`DeployPool`), and the adapter workload deployed and Online.

```powershell
octo-cli -c InstallBlueprint -b FamilyOs.MainLatest-1.0.0
octo-cli -c DeployDataFlow --identifier 0fa000000000000000000001
octo-cli -c DeployWorkload -id 0fa000000000000000000020
```

App URL: `https://familyos-<tenant>.<cluster default domain>` — on local kind
`https://familyos-<tenant>.127.0.0.1.nip.io`.

## Repo layout

| Path | Purpose |
|---|---|
| `ck/ConstructionKit/` | `FamilyOs` CK model source (YAML), wrapped by `ck/FamilyOs.csproj` — `dotnet build FamilyOs.sln -c DebugL` compiles **and** publishes it to the local CK catalog |
| `blueprint/FamilyOs.MainLatest/` | Blueprint variant for **dev/test** (Application → meshmakers-dev Helm repo `…003`) — manifest + seed data (DataFlow, 16 pipelines, Application, domain seeds) |
| `blueprint/FamilyOs.Release/` | Blueprint variant for **staging/production** (Application → meshmakers-apps release Helm repo `…005`). Seed differs from MainLatest only in that one association — keep them in sync |
| `src/charts/family-os-app/` | The app's own Helm chart (based on the one-time-ticket-app chart), published to the dev + apps channels by CI |
| `app/client/` | The React + Vite SPA (originally a localStorage-only app; the Zustand store now syncs every action to the mesh API) |
| `app/server/` | Zero-dependency Node proxy fulfilling the chart contract (`PORT`/`UPSTREAM_URL`, port 5055, `GET /` → SPA) |
| `app/Dockerfile` | Multi-stage build: Vite build → runtime image (multi-arch in CI) |
| `azure-pipelines.yml` | CI using the shared `octo-pipeline-templates` + `helm-chart-build` templates (one-time-ticket pattern) |
| `test/dataflow-test.yaml` | Scratch dataflow used for pipeline iteration (scratch 0fa9… rtIds) — source of the blueprint pipeline YAML; keep in sync |

## Developer workflow

```powershell
# 1. CK model: compile + publish to the workspace-local CK catalog
dotnet build FamilyOs.sln -c DebugL

# 2. Import into your dev tenant for pipeline iteration
octo-cli -c ImportCk -f ck/bin/DebugL/net10.0/octo-ck-libraries/FamilyOs/out/ck-familyos.yaml -w

# 3. Iterate pipelines on the scratch dataflow
octo-cli -c ImportRt -f test/dataflow-test.yaml -w        # -r on re-runs
octo-cli -c DeployDataFlow --identifier 0fa900000000000000000001
kubectl port-forward -n octo svc/<tenant>-670000000000000000000002 5020:80
curl http://localhost:5020/<tenant>/state

# 4. Frontend dev against the port-forwarded adapter
cd app/client && npm run dev                              # Vite proxies /api → localhost:5020

# 5. App image for local kind (tag BOTH names — the controller injects the registry prefix)
docker build -t meshmakers/family-os-app:0.1.0 app
docker tag meshmakers/family-os-app:0.1.0 docker.mm.cloud/meshmakers/family-os-app:0.1.0
kind load docker-image --name kind meshmakers/family-os-app:0.1.0 docker.mm.cloud/meshmakers/family-os-app:0.1.0

# 6. Blueprint into the workspace-local catalog (cache only rebuilds when missing!)
#    <workspace>/.octo/local-blueprint-catalog/blueprints/v1/FamilyOs.MainLatest/1.0.0/…
#    then: rm <workspace>/.octo/local-blueprint-catalog/cache/local-blueprint-catalog-cache.json
```

## CI / releasing

`azure-pipelines.yml` (root, pool `meshmakers-ci-agents`) uses the shared
`octo-pipeline-templates` + `helm-chart-build` templates — the same shape as
`one-time-ticket`. The CK model and both blueprints go through the shared
`validate-and-publish-ck-versions` / `validate-and-publish-blueprints` steps, which
gate version and schema on every push and route by branch/tag (via the shared
`update-build-number` template). Published versions are never replaced, so a
content change needs a version bump:

| Trigger | CK model | Blueprints | Chart | Image |
|---|---|---|---|---|
| `dev/*` | validate only | validate only | — | build (no publish) |
| `main` | `PrivateGitHubCatalog` | `PrivateGitHubBlueprintCatalog` | dev channel | push `<buildnumber>` |
| `test/<X.Y>-*` | validate only | validate only | — | push `<buildnumber>` |
| `r<X.Y.Z>` tag | `PrivateGitHubCatalog` **and** `PublicGitHubCatalog` | `PrivateGitHubBlueprintCatalog` **and** `PublicGitHubBlueprintCatalog` | **apps release channel** | push `<X.Y.Z>` |

Managed environments (staging/prod) read the public CK catalog + the apps
release Helm channel, so cutting an `r*` tag is what makes the app installable
there. The chart `appVersion` is set to the image build number, so the chart's
`image.tag` default resolves to the matching image — no pinned tag anywhere.

One-time ADO setup (mirrors one-time-ticket): create the pipeline definition
pointing at `azure-pipelines.yml`, authorize variable groups
`ApiKeys-mm-cloud` + `OctoDefault`, the docker registry service connection and
`HelmChartBuildGhToken`. Push a `dev/*` branch first — it runs build +
validate + image build with all publishing gated off.

NOTE: blueprint `FamilyOs.MainLatest` ≥ 1.0.1 references the own
`family-os-app` chart — installable only after the first `main` CI run has
published the chart to the dev channel. Until then, local installs use
1.0.0 (property-walker chart + image override).

## Wire contract (client ↔ pipelines)

- Enum values are **written** as CK enum names (`"Mama"`, `"Recurring"`,
  `"Drugstore"`, `"None"`) and **read** back as integer enum keys (0/1/2);
  `app/client/src/api.ts` maps both directions.
- Day keys go out as `YYYY-MM-DD` but come back re-formatted — the adapter's
  JSON body parse converts date-looking strings to DateTime. The client
  normalizes on read.
- The earned-sticker set can never be written as an empty array from a
  pipeline (it would null the attribute) — `POST /household/stickers` takes a
  `count` field and stores the sentinel `["~"]` for the empty set; readers
  filter it.
- Errors come back as HTTP 200 with `{ "error": … }` payloads.

## Known limitations (by design — family-internal app)

- **No auth on the endpoints.** Anyone who can reach the URL can use the API.
- **Score booking is not atomic.** Two perfectly concurrent toggles could
  race on the household scores. Irrelevant for one family.
- Attribute defaults are always materialized by the API (`""`/`0`) — entities
  hand-created in Studio without them can 500 the `GET /state` mapping.

## Platform gotchas (cost real time — don't rediscover)

1. **Same-version CK re-import is a no-op.** Changing an attribute type
   requires a version bump — or, for an unreleased model, delete + recreate
   the tenant (a bare `Clean` breaks identity provisioning; `Delete` +
   `Create` works).
2. **`ImportRt -r` on a live dataflow poisons the pipeline registration** —
   the controller then alternates between removing the changed and the
   unchanged pipeline sets on every deploy. Recovery:
   `UndeployDataFlow` + `DeployDataFlow` (or adapter pod restart + single
   deploy). The fresh blueprint-install path is unaffected.
3. **Absolute `targetPath`s inside `ForEach@1` do not reach the root
   context** (including `$.full.…`), and `ApplyChanges@2` silently no-ops on
   a missing `entityUpdatesPath`. Accumulate per-item results via the
   `mergePath`/`targetPath` child-subtree mechanism instead (see
   `fam-clear-done-shopping`).
4. **First adapter-image pull can exceed the operator's 5-minute atomic helm
   timeout** — the release rolls back and the racing old pod de-registers the
   new one. Re-trigger `DeployWorkload`, then restart the adapter pod for a
   clean registration.
5. The local CK **and** blueprint catalogs are workspace-relative
   (`<workspace>/.octo/local-catalog`, `<workspace>/.octo/local-blueprint-catalog`)
   — not `~/.octo`.
6. **Changing an Application's chart requires `UndeployWorkload` + fresh
   `DeployWorkload`.** A plain redeploy runs `helm upgrade` on the same
   release; since resource names embed the chart name, the new chart's
   ingress collides with the old one on the same host (nginx admission
   webhook rejects it) and the atomic rollback can strand orphaned
   resources without a release (clean up via
   `kubectl delete deploy,svc,ingress,sa -l app.kubernetes.io/instance=<release>`).
7. **Seeded mutable entities need `System/RtBlueprintLocked-1: false` in the
   seed.** Blueprint updates (Merge/Full) update locked entities and SKIP
   unlocked ones (`BlueprintService.ComputeUpdateDiffAsync`) — since 1.0.2
   the Household and the calendar categories are seeded unlocked, so
   updates no longer reset names/scores/stickers. Two caveats: the update
   that first applies the unlock still rewrites the entity once, and
   `InstallBlueprint -f` (ReApply) is a full re-seed that ignores locks —
   it remains the deliberate factory-reset.
