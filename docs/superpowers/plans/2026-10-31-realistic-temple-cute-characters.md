# Realistic Temple and Cute Characters Implementation Plan


**Goal:** Replace the primitive MVP appearance with detailed natural temple scenery and two original cute Blender characters.

**Architecture:** Keep the existing map footprint, game state, and eight action names. Blender generates editable character sources and animated GLB exports; Three.js renders locally stored PBR textures and instanced architectural/vegetation details.

**Tech Stack:** Blender Python, glTF, React Three Fiber, Three.js, existing Node/Colyseus backend.

**Spec:** `docs/superpowers/specs/2026-10-31-realistic-temple-cute-characters-design.md`

## Global Constraints

- Cảnh vật giống thật nhất có thể; nhân vật theo hướng dễ thương.
- Chùa Việt Nam, two fixed grey-blue outfits, no new gameplay systems.
- Preserve `male_lam.glb`, `female_lam.glb` and idle/walk/wave/bow/sit/incense/sweep/water contract.
- Local, appropriately licensed assets; no purchases or public deployment.
- Cap DPR, texture resolution, shadows and vegetation draw calls.

## Review Focus

- Multiple avatars must not share skeleton pose or animation state: verify independent animation instances.
- Blender axes/scale must agree with existing positive-Z facing and ground level: inspect GLB and gameplay screenshots.
- Details must not block interactions or create collider mismatch: keep footprints and inspect all three spots.
- Texture and model loading failures must remain observable: browser console/network check and asset existence validation.
- Large vegetation/roof counts must be instanced, with bounded geometry and download sizes: inspect scene statistics and asset totals.

## Task 1 — Blender character pipeline

Files: `frontend/scripts/blender/create_characters.py`, `frontend/public/models/*_lam.glb`, editable sources under `art/characters/`, `frontend/scripts/validate-assets.mjs`, `frontend/src/game/characters/Character.tsx`.

- [x] Add asset verification for eight clips, smooth detailed mesh, humanoid proportions and compatible orientation. Observe old assets fail new provenance/detail requirements.
- [x] Generate two original rounded characters with face, hair, collar, placket, seams, cuffs, loose pants, sandals and compatible animation. Save `.blend` sources and exported GLB.
- [x] Render previews in Blender and inspect faces/clothing; fix visible defects before integration.
- [x] Validate GLBs; preserve per-instance animation isolation (SkeletonUtils clone if skinned).

## Task 2 — Natural temple scene

Files: `frontend/src/game/scene/materials.ts`, `Temple.tsx`, `Vegetation.tsx`, `World.tsx`, `frontend/public/textures/`, `docs/assets.md`.

- [x] Select and download CC0 texture maps, record source URLs/licenses and cap maps at 1K–2K.
- [x] Add reusable PBR materials, tiled courtyard, layered curved roof tiles, wooden joinery and stone detail with shared/instanced meshes.
- [x] Replace polygon canopies with branches and leaf clusters; improve pond, lotus and garden ground cover, preserving walkable footprints.
- [x] Adjust environment, exposure and shadows for natural early-morning light; preserve readable UI.

## Task 3 — Verify and hand off

Files: preview/testing scripts, `docs/implementation.md`, `README.md`, this plan.

- [x] Build frontend, run asset contract and backend regression checks.
- [x] Capture home, both Blender character previews, gameplay and sitting; inspect images and resolve visual failures. Interaction footprints remain unchanged.
- [x] Run two-browser multiplayer smoke for replacement characters and check no console/asset failures.
- [x] Self-review integration; fix camera raycast and loading-overlay lifecycle defects, document asset sizes and instancing counts. No independent review or full FPS benchmark in this pass.
- [x] Update reproduction commands and asset documentation, stop owned preview processes.

## Execution ledger

- User explicitly requested implementation after installing Blender. Execute inline without another approval round; existing design is approved by this instruction.
- Workspace has no Git repository, so use the existing project directory, preserve source spec, and avoid initializing a repository or duplicating the checkout.
- Blender found via Windows installer registration at `D:/Blender/blender.exe`.
- Visual-only reversible changes use rendered comparisons; add tests for asset/animation contracts rather than mirroring geometry implementation.
- Final assets: male 907 KiB, female 1000 KiB; each has one skin and eight clips. Textures/HDR/manifest total 14,056,777 bytes.
- Pose regression caught incorrect Blender local axis for sitting; fixed root local Y translation. Both character pose checks pass.
- Camera now intersects only cameraCollider objects, excluding instanced foliage/roof detail from per-frame raycasts.
- Loading overlay moved outside R3F Suspense: repeated texture suspension caused Html root deletion errors. Browser regression reproduced errors before and passed after the change.
- Browser smoke now uses full headless Chromium; old headless-shell SwiftShader timed out with simultaneous scenes. SOFTWARE_GL=1 remains available; no low-end FPS guarantee.

