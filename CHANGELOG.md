# Changelog

Version history of the FamilyOs CK model (`ck/ConstructionKit/ckModel.yaml`).
Published versions are immutable; every change of the model needs a new version
(`octo-ckc -c ValidateVersion`).

## FamilyOs 1.3.0 — 2026-10-26 (AB#7123)

Pure version bump, no content change: the one-time re-pin to the range-retaining
CK compiler (CK v2 Feature F2.6, AB#5688; SemVer row D6).

- `octo-ckc -c ValidateVersion` against `PrivateGitHubCatalog` reported `OCTO-CK100`,
  MINOR, minimum 1.3.0: `rangeRetention` false → true, and the resolved `System`
  dependency 2.5.0 → 2.7.0. With 1.3.0 the result is VALID.
- The compiled model keeps the declared range `System-[2.5,3.0)` (floor 2.5.0, used
  surface `System@2/Entity-1`), records the resolved closure `System-2.7.0` and carries
  `minEngineVersion: 3.5.1`.

**Compatibility impact:** additive MINOR version. 1.3.0 is published on the v3
catalog path, so engines below 3.5.1 do not see it and stay on 1.2.0. Installed
tenants are not changed by the publish; a tenant whose FamilyOs 1.2.0 went
`ResolveFailed` after its System was raised (1.2.0 pins `System-2.5.0` exactly) is
updated to 1.3.0 with `LibraryStatus` / `FixAll` as a separate, explicit step. The
blueprints already admit 1.3.0 (`FamilyOs-[1.2.0,2.0.0)`), so they need no change.

## FamilyOs 1.2.0 and earlier

Classic exact-pin versions (`System-2.5.0` for 1.2.0), published on the v2 catalog
path. Not itemised here.
