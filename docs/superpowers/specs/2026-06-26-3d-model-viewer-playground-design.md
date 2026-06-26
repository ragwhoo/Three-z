# 3D Model Viewer Playground

## Purpose
A browser-based tool for previewing, adjusting, and exporting camera positions from 3D models. Used to capture named camera presets for reuse in Three.js websites built with OpenCode.

## Architecture

```
src/
  main.js                  — Scene, renderer, camera, OrbitControls, animation loop
  modules/
    ModelLoader.js         — Drag-drop zone + file picker button (GLTF/GLB)
    ScenePanel.js          — Main draggable UI panel, all sub-controls
    LightingManager.js     — Ambient, hemisphere, directional, fill, rim lights
    MaterialControls.js    — Global & per-material roughness/metalness/envIntensity/color
    EnvironmentManager.js  — Background color, env map presets, ground plane, grid, shadows
    CameraPresets.js       — Save/load/export named camera position + target
  utils/
    CameraDebugger.js      — Reused as live camera readout (C key)
  styles/
    main.css               — Minimal white/black theme
```

## File format support
- Primary: GLTF (`.gltf`, `.glb`)
- Future: other formats optional

## ScenePanel UI
Draggable, collapsible overlay with these sections:

### Model section
- "Choose Model" file button + drag-drop zone overlay
- Displays loaded model filename
- Reset model button (remove from scene)

### Scene section
- **Background color** picker
- **Ground** toggle + color picker
- **Grid helper** toggle
- **Shadows** toggle (enables/disables shadow map rendering)

### Lighting section
Each light has: intensity slider + color picker

| Light | Intensity range | Default | Notes |
|-------|----------------|---------|-------|
| Ambient | 0–2 | 0.4 | Global fill |
| Hemisphere Sky | 0–2 | 0.8 | Sky color picker |
| Hemisphere Ground | 0–2 | 0.8 | Ground color picker |
| Key (directional) | 0–5 | 2.5 | Position X/Y/Z sliders |
| Fill | 0–3 | 0.8 | Position X/Y/Z sliders |
| Rim/Back | 0–3 | 0.6 | Position X/Y/Z sliders |

### Environment section
- **Env map preset** dropdown: Studio Soft, Outdoor Sunny, Garage Moody, Night Neon, Workshop, Custom
- Each preset generates 4–6 colored directional lights fed to PMREMGenerator
- **Env intensity** slider (0–5)

### Material section
- **Enable overrides** toggle
- Global: **Roughness** slider (0–1), **Metalness** slider (0–1), **Env Intensity** slider (0–5), **Base Color** picker
- Per-material dropdown: select a mesh material by name, tweak its roughness/metalness/color individually

### Camera section
- Live position/target/FOV readout (reuses CameraDebugger)
- **Save** current position with a name
- **Load** named preset (restores camera)
- **Delete** named preset
- **Export All** — copies JSON to clipboard with all presets

## Export Format
```json
{
  "hero": {
    "position": [x, y, z],
    "target": [x, y, z],
    "fov": 45
  },
  "intro": {
    "position": [x, y, z],
    "target": [x, y, z],
    "fov": 45
  }
}
```

Exported via clipboard copy. Consumed by OpenCode when building section-based Three.js sites.

## Deployment
`npm run build` → Vite outputs static `dist/` folder → deploy to any static host (Netlify, Vercel, GitHub Pages, etc).

## Workflow
1. Open the tool
2. Drag-drop or pick a GLTF/GLB model
3. Adjust camera with OrbitControls + WASD
4. Tweak lighting, materials, environment to taste
5. Save camera position with a name (e.g. "hero")
6. Repeat for all desired angles
7. Export all presets as JSON
8. Paste JSON into website project config for OpenCode consumption
