# 3D Model Viewer Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based 3D model viewer playground with drag-drop GLTF/GLB loading, adjustable lighting/materials/environment, named camera presets, and JSON export.

**Architecture:** Modular — `main.js` instantiates standalone manager modules (`LightingManager`, `EnvironmentManager`, `CameraPresets`, `MaterialControls`, `ModelLoader`) and passes them to a single `ScenePanel` UI overlay. Vite builds static `dist/`.

**Tech Stack:** Three.js, GSAP (keep existing), Vite

---

### Task 1: Strip Mazda content, set up file structure

**Files:**
- Modify: `index.html`
- Create: `src/modules/` directory
- Delete: `src/utils/CameraDebugger.js` (will be rewritten)
- Modify: `src/main.js`

- [ ] **Step 1: Create `src/modules/` directory**

Run: `New-Item -ItemType Directory -Path "src/modules" -Force` in project root.

Expected: directory created with no errors.

- [ ] **Step 2: Strip down index.html**

Replace entire content of `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Model Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/styles/main.css" />
</head>
<body>
  <div id="container-3d"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

Remove all section HTML. No Mazda content. Single container div.

- [ ] **Step 3: Strip main.js to skeleton**

Replace `src/main.js` with absolute minimal:

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = document.getElementById('container-3d')

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(5, 3, 5)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
container.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0)
controls.enableDamping = false
controls.update()

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
```

No GSAP import, no Mazda code, no model loading, no section transitions.

- [ ] **Step 4: Rename CameraDebugger.js placeholder**

Create `src/utils/CameraDebugger.js` as minimal placeholder:

```js
export class CameraDebugger {
  constructor({ camera, controls, renderer }) {
    this.camera = camera
    this.controls = controls
    this.renderer = renderer
    this.visible = false
  }

  getData() {
    const { position, rotation, quaternion } = this.camera
    const target = this.controls?.target || { x: 0, y: 0, z: 0 }
    return {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
      target: [target.x, target.y, target.z],
      fov: this.camera.fov,
      distance: position.distanceTo(target),
    }
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: strip Mazda content, prepare modular structure"
```

---

### Task 2: Rewrite CSS for white/black minimal theme

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Replace CSS with white/black theme**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #fff;
  color: #111;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

#container-3d {
  position: fixed;
  inset: 0;
  z-index: 0;
}

#container-3d canvas {
  display: block;
}

/* Drag-drop overlay */
#drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  font-size: 1.25rem;
  font-weight: 500;
  color: #888;
  border: 3px dashed #ccc;
  margin: 16px;
  border-radius: 20px;
  pointer-events: none;
}

#drop-overlay.active {
  display: flex;
}

/* Panel styles */
#sp-panel {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 99999;
  width: 280px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  color: #333;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.1);
  user-select: none;
  cursor: grab;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}

#sp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: grab;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px);
  z-index: 1;
}

#sp-title {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: -0.01em;
  color: #111;
}

#sp-collapse {
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: rgba(0,0,0,0.3);
  padding: 0 2px;
}

#sp-collapse:hover {
  color: #111;
}

.sp-body {
  padding: 6px 14px 14px;
}

.sp-section {
  margin-top: 8px;
}

.sp-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  cursor: pointer;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0,0,0,0.4);
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.sp-section-header:hover {
  color: #111;
}

.sp-section-header .arrow {
  font-size: 10px;
  transition: transform 0.15s;
}

.sp-section-header .arrow.open {
  transform: rotate(90deg);
}

.sp-section-content {
  padding: 6px 0;
}

.sp-section-content.hidden {
  display: none;
}

.sp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
}

.sp-label {
  color: rgba(0,0,0,0.5);
  font-size: 11px;
  min-width: 60px;
}

.sp-val {
  color: #111;
  font-size: 11px;
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
}

.sp-sep {
  height: 1px;
  background: rgba(0,0,0,0.04);
  margin: 4px 0;
}

input[type="range"] {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #333;
  cursor: pointer;
}

input[type="color"] {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  background: none;
}

input[type="text"] {
  padding: 4px 8px;
  font-size: 11px;
  font-family: inherit;
  color: #333;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 5px;
  outline: none;
  width: 100%;
}

input[type="text"]:focus {
  border-color: rgba(0,0,0,0.3);
}

select {
  padding: 4px 8px;
  font-size: 11px;
  font-family: inherit;
  color: #333;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 5px;
  outline: none;
  cursor: pointer;
  width: 100%;
}

.sp-btn {
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 500;
  font-family: inherit;
  color: #333;
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
}

.sp-btn:hover {
  background: rgba(0,0,0,0.08);
}

.sp-btn.sm {
  padding: 4px 8px;
  font-size: 10px;
}

.sp-btn.danger {
  color: #e74c3c;
  border-color: rgba(231,76,60,0.25);
}

.sp-btn.danger:hover {
  background: rgba(231,76,60,0.08);
}

.sp-btn.primary {
  color: #fff;
  background: #333;
  border-color: #333;
}

.sp-btn.primary:hover {
  background: #555;
}

.sp-btn-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.sp-file-btn {
  position: relative;
  overflow: hidden;
}

.sp-file-btn input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.sp-toggle {
  position: relative;
  width: 32px;
  height: 18px;
  background: rgba(0,0,0,0.1);
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s;
}

.sp-toggle.active {
  background: #333;
}

.sp-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.sp-toggle.active::after {
  transform: translateX(14px);
}

.sp-preset-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

/* Model info */
#sp-model-name {
  font-size: 11px;
  color: #666;
  padding: 4px 0;
  word-break: break-all;
}

/* Camera readout */
#sp-cam-data {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #666;
  line-height: 1.6;
}

#drop-zone {
  border: 2px dashed rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

#drop-zone:hover {
  border-color: rgba(0,0,0,0.3);
  background: rgba(0,0,0,0.02);
}

/* Scrollbar */
#sp-panel::-webkit-scrollbar {
  width: 4px;
}

#sp-panel::-webkit-scrollbar-track {
  background: transparent;
}

#sp-panel::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add white/black minimal CSS with panel styles"
```

---

### Task 3: CameraPresets module

**Files:**
- Create: `src/modules/CameraPresets.js`

- [ ] **Step 1: Create CameraPresets.js**

```js
const STORAGE_KEY = 'model-viewer-presets'

export class CameraPresets {
  constructor(camera, controls) {
    this.camera = camera
    this.controls = controls
  }

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  save(name) {
    const presets = this.getAll()
    const pos = this.camera.position
    const target = this.controls.target
    presets[name] = {
      position: [pos.x, pos.y, pos.z],
      target: [target.x, target.y, target.z],
      fov: this.camera.fov,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  }

  load(name) {
    const presets = this.getAll()
    const p = presets[name]
    if (!p) return false
    this.camera.position.set(p.position[0], p.position[1], p.position[2])
    this.camera.fov = p.fov
    this.camera.updateProjectionMatrix()
    this.controls.target.set(p.target[0], p.target[1], p.target[2])
    this.controls.update()
    return true
  }

  delete(name) {
    const presets = this.getAll()
    delete presets[name]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  }

  exportJSON() {
    return JSON.stringify(this.getAll(), null, 2)
  }

  getNames() {
    return Object.keys(this.getAll())
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add CameraPresets module with save/load/delete/export"
```

---

### Task 4: ModelLoader module

**Files:**
- Create: `src/modules/ModelLoader.js`

- [ ] **Step 1: Create ModelLoader.js**

```js
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class ModelLoader {
  constructor(scene, renderer) {
    this.scene = scene
    this.renderer = renderer
    this.model = null
    this.loader = new GLTFLoader()
    this.onLoad = null
    this._currentModel = null
  }

  load(url) {
    this.loader.load(
      url,
      (gltf) => {
        this._addModel(gltf.scene)
      },
      undefined,
      (err) => console.error('Model load error:', err)
    )
  }

  loadFile(file) {
    const url = URL.createObjectURL(file)
    this.loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url)
        this._addModel(gltf.scene)
      },
      undefined,
      (err) => {
        URL.revokeObjectURL(url)
        console.error('Model load error:', err)
      }
    )
  }

  _addModel(scene) {
    this.clear()

    this._currentModel = scene

    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim > 0) {
      const scale = 5 / maxDim
      scene.scale.set(scale, scale, scale)
    }

    box.setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    scene.position.sub(center)

    this.scene.add(scene)
    this.model = scene

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          mats.forEach((mat) => {
            mat.envMapIntensity = 1.0
            mat.needsUpdate = true
          })
        }
      }
    })

    if (this.onLoad) this.onLoad(scene)
  }

  clear() {
    if (this._currentModel) {
      this.scene.remove(this._currentModel)
      this._currentModel.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.geometry.dispose()
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material]
            mats.forEach((m) => m.dispose())
          }
        }
      })
      this._currentModel = null
      this.model = null
    }
  }

  getMaterials() {
    const mats = []
    if (!this.model) return mats
    this.model.traverse((child) => {
      if (child.isMesh && child.material) {
        const arr = Array.isArray(child.material) ? child.material : [child.material]
        arr.forEach((mat) => {
          if (mat.name && !mats.find((m) => m.name === mat.name)) {
            mats.push(mat)
          }
        })
      }
    })
    return mats
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add ModelLoader module with drag-drop + file picker support"
```

---

### Task 5: EnvironmentManager module

**Files:**
- Create: `src/modules/EnvironmentManager.js`

- [ ] **Step 1: Create EnvironmentManager.js**

```js
import * as THREE from 'three'

export class EnvironmentManager {
  constructor(scene, renderer) {
    this.scene = scene
    this.renderer = renderer
    this.ground = null
    this.grid = null
    this.shadowsEnabled = true
    this.envMap = null

    this._createGround()
    this._generateEnvMap('studio')
  }

  setBackground(color) {
    this.scene.background = new THREE.Color(color)
  }

  _createGround() {
    const geo = new THREE.PlaneGeometry(20, 20)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8,
      metalness: 0,
      transparent: true,
      opacity: 1,
    })
    this.ground = new THREE.Mesh(geo, mat)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.y = -2
    this.ground.receiveShadow = true
    this.scene.add(this.ground)
  }

  setGroundVisible(visible) {
    this.ground.visible = visible
  }

  setGroundColor(color) {
    this.ground.material.color.setHex(color)
  }

  toggleGrid(visible) {
    if (visible && !this.grid) {
      const helper = new THREE.GridHelper(20, 20, 0xcccccc, 0xdddddd)
      helper.position.y = -1.999
      this.grid = helper
      this.scene.add(helper)
    } else if (this.grid) {
      this.grid.visible = visible
    }
  }

  toggleShadows(enabled) {
    this.shadowsEnabled = enabled
    this.renderer.shadowMap.enabled = enabled
    if (this.ground) this.ground.receiveShadow = enabled
    if (this.scene) {
      this.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = enabled
          child.receiveShadow = enabled
        }
      })
    }
  }

  setEnvIntensity(intensity) {
    if (this.envMap) {
      this.envMap.intensity = intensity
    }
  }

  _generateEnvMap(preset) {
    if (this.envMap) {
      this.envMap.dispose()
      this.envMap = null
    }

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    const envScene = new THREE.Scene()

    const lights = this._getEnvLights(preset)
    lights.forEach((l) => envScene.add(l))

    this.envMap = pmremGenerator.fromScene(envScene).texture
    this.envMap.intensity = 1.0
    this.scene.environment = this.envMap
    pmremGenerator.dispose()
  }

  _getEnvLights(preset) {
    const l1 = new THREE.DirectionalLight(0xffaa66, 1.5)
    const l2 = new THREE.DirectionalLight(0x6688ff, 1.5)
    const l3 = new THREE.DirectionalLight(0xffffff, 0.8)
    const l4 = new THREE.DirectionalLight(0xff8844, 0.6)

    switch (preset) {
      case 'studio':
        l1.position.set(2, 3, 4)
        l2.position.set(-3, -1, -2)
        l3.position.set(-1, 2, -3)
        l4.position.set(3, 0, -4)
        l1.color.setHex(0xffdd99)
        l2.color.setHex(0x88aaff)
        l3.color.setHex(0xffffff)
        l4.color.setHex(0xffaa77)
        return [l1, l2, l3, l4]
      case 'outdoor':
        l1.position.set(5, 8, 5)
        l2.position.set(-3, 1, -2)
        l3.position.set(0, 5, -5)
        l4.position.set(2, 0, 4)
        l1.color.setHex(0xffeecc)
        l1.intensity = 2.5
        l2.color.setHex(0x88ccff)
        l2.intensity = 1.0
        l3.color.setHex(0xffffcc)
        l3.intensity = 0.5
        l4.color.setHex(0x88ddff)
        l4.intensity = 0.5
        return [l1, l2, l3, l4]
      case 'garage':
        l1.position.set(1, 2, 3)
        l2.position.set(-2, 0, -1)
        l3.position.set(0, 3, -2)
        l4.position.set(2, 0, -3)
        l1.color.setHex(0xffcc88)
        l1.intensity = 1.0
        l2.color.setHex(0xccddff)
        l2.intensity = 0.5
        l3.color.setHex(0xffffff)
        l3.intensity = 0.6
        l4.color.setHex(0xff8844)
        l4.intensity = 0.4
        return [l1, l2, l3, l4]
      case 'moody':
        l1.position.set(1, 0, 3)
        l2.position.set(-1, 0, -2)
        l3.position.set(0, 1, -3)
        l4.position.set(2, -1, 4)
        l1.color.setHex(0x4488ff)
        l1.intensity = 0.8
        l2.color.setHex(0xff4488)
        l2.intensity = 0.6
        l3.color.setHex(0x8844ff)
        l3.intensity = 0.4
        l4.color.setHex(0x2266cc)
        l4.intensity = 0.3
        return [l1, l2, l3, l4]
      case 'workshop':
        l1.position.set(3, 4, 2)
        l2.position.set(-2, 2, -1)
        l3.position.set(0, 5, 0)
        l4.position.set(1, 0, -4)
        l1.color.setHex(0xffffff)
        l1.intensity = 2.0
        l2.color.setHex(0xddddff)
        l2.intensity = 0.8
        l3.color.setHex(0xffffcc)
        l3.intensity = 1.5
        l4.color.setHex(0xccccff)
        l4.intensity = 0.5
        return [l1, l2, l3, l4]
      default:
        l1.position.set(2, 3, 4)
        l2.position.set(-3, -1, -2)
        return [l1, l2]
    }
  }

  setEnvPreset(preset) {
    this._generateEnvMap(preset)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add EnvironmentManager with bg, ground, grid, shadows, env presets"
```

---

### Task 6: LightingManager module

**Files:**
- Create: `src/modules/LightingManager.js`

- [ ] **Step 1: Create LightingManager.js**

```js
import * as THREE from 'three'

export class LightingManager {
  constructor(scene) {
    this.scene = scene
    this.lights = {}

    this._createLights()
  }

  _createLights() {
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.lights.ambient)

    this.lights.hemi = new THREE.HemisphereLight(0x87ceeb, 0x362d24, 0.8)
    this.scene.add(this.lights.hemi)

    this.lights.key = new THREE.DirectionalLight(0xffffff, 2.5)
    this.lights.key.position.set(5, 8, 5)
    this.lights.key.castShadow = true
    this.lights.key.shadow.mapSize.width = 2048
    this.lights.key.shadow.mapSize.height = 2048
    this.lights.key.shadow.camera.near = 0.1
    this.lights.key.shadow.camera.far = 30
    this.lights.key.shadow.camera.left = -10
    this.lights.key.shadow.camera.right = 10
    this.lights.key.shadow.camera.top = 10
    this.lights.key.shadow.camera.bottom = -10
    this.lights.key.shadow.bias = -0.001
    this.lights.key.shadow.normalBias = 0.02
    this.lights.key.shadow.radius = 4
    this.scene.add(this.lights.key)

    this.lights.fill = new THREE.DirectionalLight(0x4488ff, 0.8)
    this.lights.fill.position.set(-4, 2, -3)
    this.scene.add(this.lights.fill)

    this.lights.rim = new THREE.DirectionalLight(0xff8844, 0.6)
    this.lights.rim.position.set(-2, 1, -5)
    this.scene.add(this.lights.rim)
  }

  setIntensity(name, value) {
    if (this.lights[name]) {
      this.lights[name].intensity = value
    }
  }

  setColor(name, hex) {
    if (this.lights[name]) {
      this.lights[name].color.setHex(hex)
    }
  }

  setPosition(name, x, y, z) {
    if (this.lights[name] && this.lights[name].isDirectionalLight) {
      this.lights[name].position.set(x, y, z)
    }
  }

  getPosition(name) {
    if (this.lights[name] && this.lights[name].isDirectionalLight) {
      return { x: this.lights[name].position.x, y: this.lights[name].position.y, z: this.lights[name].position.z }
    }
    return { x: 0, y: 0, z: 0 }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add LightingManager with ambient/hemi/key/fill/rim lights"
```

---

### Task 7: MaterialControls module

**Files:**
- Create: `src/modules/MaterialControls.js`

- [ ] **Step 1: Create MaterialControls.js**

```js
export class MaterialControls {
  constructor() {
    this.model = null
    this.enabled = false
    this.globalOverrides = {
      roughness: 0.4,
      metalness: 0.3,
      envIntensity: 1.0,
      color: null,
    }
    this.perMaterialOverrides = {}
  }

  setModel(model) {
    this.model = model
    this.perMaterialOverrides = {}
  }

  setEnabled(val) {
    this.enabled = val
    this._apply()
  }

  setGlobalRoughness(val) {
    this.globalOverrides.roughness = val
    if (this.enabled) this._apply()
  }

  setGlobalMetalness(val) {
    this.globalOverrides.metalness = val
    if (this.enabled) this._apply()
  }

  setGlobalEnvIntensity(val) {
    this.globalOverrides.envIntensity = val
    if (this.enabled) this._apply()
  }

  setGlobalColor(hex) {
    this.globalOverrides.color = hex
    if (this.enabled) this._apply()
  }

  setPerMaterialOverride(name, property, value) {
    if (!this.perMaterialOverrides[name]) {
      this.perMaterialOverrides[name] = {}
    }
    this.perMaterialOverrides[name][property] = value
    if (this.enabled) this._apply()
  }

  _apply() {
    if (!this.model) return
    this.model.traverse((child) => {
      if (!child.isMesh || !child.material) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((mat) => {
        if (!this.enabled) return

        if (this.globalOverrides.color !== null) {
          mat.color.setHex(this.globalOverrides.color)
        }
        if (mat.roughness !== undefined) {
          mat.roughness = this.globalOverrides.roughness
        }
        if (mat.metalness !== undefined) {
          mat.metalness = this.globalOverrides.metalness
        }
        mat.envMapIntensity = this.globalOverrides.envIntensity

        const overrides = this.perMaterialOverrides[mat.name]
        if (overrides) {
          if (overrides.color !== undefined) mat.color.setHex(overrides.color)
          if (overrides.roughness !== undefined) mat.roughness = overrides.roughness
          if (overrides.metalness !== undefined) mat.metalness = overrides.metalness
          if (overrides.envIntensity !== undefined) mat.envMapIntensity = overrides.envIntensity
        }

        mat.needsUpdate = true
      })
    })
  }

  getMaterialNames() {
    const names = []
    if (!this.model) return names
    this.model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          if (mat.name && !names.includes(mat.name)) {
            names.push(mat.name)
          }
        })
      }
    })
    return names
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add MaterialControls with global/per-material overrides"
```

---

### Task 8: ScenePanel module

**Files:**
- Create: `src/modules/ScenePanel.js`

- [ ] **Step 1: Create ScenePanel.js**

```js
export class ScenePanel {
  constructor({ modelLoader, environment, lighting, materials, presets }) {
    this.modelLoader = modelLoader
    this.environment = environment
    this.lighting = lighting
    this.materials = materials
    this.presets = presets

    this.visible = true
    this.collapsed = false
    this.sections = {}

    this._build()
    this._bind()
    this._setupDrag()
  }

  _build() {
    this.el = document.createElement('div')
    this.el.id = 'sp-panel'
    this.el.innerHTML = `
      <div id="sp-header">
        <span id="sp-title">Scene Controls</span>
        <span id="sp-collapse">−</span>
      </div>
      <div id="sp-body" class="sp-body">
        ${this._modelSection()}
        ${this._sceneSection()}
        ${this._lightingSection()}
        ${this._environmentSection()}
        ${this._materialSection()}
        ${this._cameraSection()}
      </div>`
    document.body.appendChild(this.el)

    this.bodyEl = this.el.querySelector('#sp-body')
    this.collapseBtn = this.el.querySelector('#sp-collapse')
  }

  _modelSection() {
    return `
      <div class="sp-section" data-section="model">
        <div class="sp-section-header">
          Model
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-model">
          <div id="drop-zone">
            Drop a .glb or .gltf file here<br/>
            <span style="font-size:10px;color:#bbb">or</span><br/>
            <button class="sp-btn sp-file-btn" style="margin-top:4px">
              Choose Model
              <input type="file" id="sp-file-input" accept=".glb,.gltf" />
            </button>
          </div>
          <div id="sp-model-name"></div>
        </div>
      </div>`
  }

  _sceneSection() {
    return `
      <div class="sp-section" data-section="scene">
        <div class="sp-section-header">
          Scene
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-scene">
          <div class="sp-row">
            <span class="sp-label">Background</span>
            <input type="color" id="sp-bg-color" value="#f0f0f0" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Ground</span>
            <span style="display:flex;align-items:center;gap:6px">
              <div class="sp-toggle active" id="sp-ground-toggle"></div>
              <input type="color" id="sp-ground-color" value="#f5f5f5" style="width:20px;height:20px" />
            </span>
          </div>
          <div class="sp-row">
            <span class="sp-label">Grid</span>
            <div class="sp-toggle" id="sp-grid-toggle"></div>
          </div>
          <div class="sp-row">
            <span class="sp-label">Shadows</span>
            <div class="sp-toggle active" id="sp-shadows-toggle"></div>
          </div>
        </div>
      </div>`
  }

  _lightingSection() {
    const lights = [
      { id: 'ambient', label: 'Ambient', hasColor: true, hasPos: false },
      { id: 'hemi', label: 'Hemi Sky', hasColor: true, hasPos: false },
      { id: 'hemi-gnd', label: 'Hemi Gnd', hasColor: true, hasPos: false },
      { id: 'key', label: 'Key', hasColor: true, hasPos: true },
      { id: 'fill', label: 'Fill', hasColor: true, hasPos: true },
      { id: 'rim', label: 'Rim', hasColor: true, hasPos: true },
    ]
    let html = `
      <div class="sp-section" data-section="lighting">
        <div class="sp-section-header">
          Lighting
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-lighting">`
    lights.forEach((l) => {
      html += `
        <div class="sp-row">
          <span class="sp-label">${l.label}</span>
          <span style="display:flex;align-items:center;gap:4px">
            <input type="range" min="0" max="5" step="0.01" value="0" id="sp-light-${l.id}-int" style="width:60px" />
            ${l.hasColor ? `<input type="color" id="sp-light-${l.id}-color" value="#ffffff" style="width:20px;height:20px" />` : ''}
            ${l.hasPos ? `<span style="font-size:9px;color:#999">XYZ</span>` : ''}
          </span>
        </div>`
      if (l.hasPos) {
        html += `
        <div class="sp-row" style="padding-left:64px">
          <span style="display:flex;gap:4px;width:100%">
            <input type="range" min="-10" max="10" step="0.1" value="0" id="sp-light-${l.id}-posx" style="width:28px" />
            <input type="range" min="-10" max="10" step="0.1" value="0" id="sp-light-${l.id}-posy" style="width:28px" />
            <input type="range" min="-10" max="10" step="0.1" value="0" id="sp-light-${l.id}-posz" style="width:28px" />
          </span>
        </div>`
      }
    })
    html += `</div></div>`
    return html
  }

  _environmentSection() {
    return `
      <div class="sp-section" data-section="env">
        <div class="sp-section-header">
          Environment
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-env">
          <div class="sp-row">
            <span class="sp-label">Preset</span>
            <select id="sp-env-preset" style="width:120px">
              <option value="studio">Studio</option>
              <option value="outdoor">Outdoor Sunny</option>
              <option value="garage">Garage</option>
              <option value="moody">Night Neon</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div class="sp-row">
            <span class="sp-label">Intensity</span>
            <input type="range" min="0" max="5" step="0.01" value="1" id="sp-env-intensity" style="width:80px" />
          </div>
        </div>
      </div>`
  }

  _materialSection() {
    return `
      <div class="sp-section" data-section="mat">
        <div class="sp-section-header">
          Materials
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-mat">
          <div class="sp-row">
            <span class="sp-label">Override</span>
            <div class="sp-toggle" id="sp-mat-toggle"></div>
          </div>
          <div class="sp-row">
            <span class="sp-label">Roughness</span>
            <input type="range" min="0" max="1" step="0.01" value="0.4" id="sp-mat-roughness" style="width:80px" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Metalness</span>
            <input type="range" min="0" max="1" step="0.01" value="0.3" id="sp-mat-metalness" style="width:80px" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Env Int</span>
            <input type="range" min="0" max="5" step="0.01" value="1" id="sp-mat-envint" style="width:80px" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Color</span>
            <input type="color" id="sp-mat-color" value="#cccccc" style="width:20px;height:20px" />
          </div>
          <div class="sp-sep"></div>
          <div class="sp-row">
            <span class="sp-label">Per Mat</span>
            <select id="sp-mat-select" style="width:120px">
              <option value="">— none —</option>
            </select>
          </div>
          <div id="sp-permat-controls" style="display:none">
            <div class="sp-row">
              <span class="sp-label">Roughness</span>
              <input type="range" min="0" max="1" step="0.01" value="0.4" id="sp-permat-roughness" style="width:80px" />
            </div>
            <div class="sp-row">
              <span class="sp-label">Metalness</span>
              <input type="range" min="0" max="1" step="0.01" value="0.3" id="sp-permat-metalness" style="width:80px" />
            </div>
            <div class="sp-row">
              <span class="sp-label">Color</span>
              <input type="color" id="sp-permat-color" value="#cccccc" style="width:20px;height:20px" />
            </div>
          </div>
        </div>
      </div>`
  }

  _cameraSection() {
    return `
      <div class="sp-section" data-section="cam">
        <div class="sp-section-header">
          Camera
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-cam">
          <div id="sp-cam-data">No data</div>
          <div class="sp-sep"></div>
          <div class="sp-preset-row">
            <input type="text" id="sp-preset-name" placeholder="Preset name..." />
            <button class="sp-btn sm" id="sp-save-preset">Save</button>
          </div>
          <div class="sp-preset-row">
            <select id="sp-preset-select" style="flex:1"><option value="">— presets —</option></select>
            <button class="sp-btn sm danger" id="sp-del-preset">Del</button>
          </div>
          <div class="sp-sep"></div>
          <button class="sp-btn primary" id="sp-export-all" style="width:100%">Export All as JSON</button>
        </div>
      </div>`
  }

  _bind() {
    this._bindToggleVisibility()
    this._bindCollapse()
    this._bindSectionToggles()

    this._bindModel()
    this._bindScene()
    this._bindLighting()
    this._bindEnvironment()
    this._bindMaterials()
    this._bindCamera()
  }

  _bindToggleVisibility() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        this.visible = !this.visible
        this.el.style.display = this.visible ? 'block' : 'none'
      }
    })
  }

  _bindCollapse() {
    this.collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.collapsed = !this.collapsed
      this.bodyEl.style.display = this.collapsed ? 'none' : 'block'
      this.collapseBtn.textContent = this.collapsed ? '+' : '−'
    })
  }

  _bindSectionToggles() {
    this.el.querySelectorAll('.sp-section-header').forEach((header) => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling
        const arrow = header.querySelector('.arrow')
        const isHidden = content.classList.toggle('hidden')
        arrow.classList.toggle('open', !isHidden)
      })
    })
  }

  _bindModel() {
    const fileInput = this.el.querySelector('#sp-file-input')
    const modelName = this.el.querySelector('#sp-model-name')
    const dropZone = this.el.querySelector('#drop-zone')

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        modelName.textContent = file.name
        this.modelLoader.loadFile(file)
        this.modelLoader.onLoad = (scene) => {
          this.materials.setModel(scene)
          this._refreshMatSelect()
        }
      }
    })

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.style.borderColor = '#333'
      dropZone.style.background = 'rgba(0,0,0,0.04)'
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'rgba(0,0,0,0.15)'
      dropZone.style.background = 'transparent'
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.style.borderColor = 'rgba(0,0,0,0.15)'
      dropZone.style.background = 'transparent'
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        modelName.textContent = file.name
        this.modelLoader.loadFile(file)
        this.modelLoader.onLoad = (scene) => {
          this.materials.setModel(scene)
          this._refreshMatSelect()
        }
      }
    })

    document.addEventListener('dragover', (e) => {
      e.preventDefault()
    })

    document.addEventListener('drop', (e) => {
      e.preventDefault()
    })
  }

  _bindScene() {
    const bgColor = this.el.querySelector('#sp-bg-color')
    bgColor.addEventListener('input', () => this.environment.setBackground(bgColor.value))

    const groundToggle = this.el.querySelector('#sp-ground-toggle')
    groundToggle.addEventListener('click', () => {
      groundToggle.classList.toggle('active')
      this.environment.setGroundVisible(groundToggle.classList.contains('active'))
    })

    const groundColor = this.el.querySelector('#sp-ground-color')
    groundColor.addEventListener('input', () => {
      this.environment.setGroundColor(parseInt(groundColor.value.slice(1), 16))
    })

    const gridToggle = this.el.querySelector('#sp-grid-toggle')
    gridToggle.addEventListener('click', () => {
      gridToggle.classList.toggle('active')
      this.environment.toggleGrid(gridToggle.classList.contains('active'))
    })

    const shadowsToggle = this.el.querySelector('#sp-shadows-toggle')
    shadowsToggle.addEventListener('click', () => {
      shadowsToggle.classList.toggle('active')
      this.environment.toggleShadows(shadowsToggle.classList.contains('active'))
    })
  }

  _bindLighting() {
    const lightDefs = [
      { id: 'ambient', colorDefault: '#ffffff', intDefault: 0.4, pos: false },
      { id: 'hemi', colorDefault: '#87ceeb', intDefault: 0.8, pos: false },
      { id: 'hemi-gnd', colorDefault: '#362d24', intDefault: 0.8, pos: false },
      { id: 'key', colorDefault: '#ffffff', intDefault: 2.5, pos: true, posDefault: { x: 5, y: 8, z: 5 } },
      { id: 'fill', colorDefault: '#4488ff', intDefault: 0.8, pos: true, posDefault: { x: -4, y: 2, z: -3 } },
      { id: 'rim', colorDefault: '#ff8844', intDefault: 0.6, pos: true, posDefault: { x: -2, y: 1, z: -5 } },
    ]

    lightDefs.forEach((def) => {
      const intSlider = this.el.querySelector(`#sp-light-${def.id}-int`)
      const colorPicker = this.el.querySelector(`#sp-light-${def.id}-color`)

      if (intSlider) {
        intSlider.value = def.intDefault
        intSlider.addEventListener('input', () => {
          const lightId = def.id === 'hemi-gnd' ? 'hemi' : def.id
          this.lighting.setIntensity(lightId, parseFloat(intSlider.value))
        })
      }

      if (colorPicker) {
        colorPicker.value = def.colorDefault
        colorPicker.addEventListener('input', () => {
          if (def.id === 'hemi-gnd') {
            this.lighting.lights.hemi.groundColor.setHex(parseInt(colorPicker.value.slice(1), 16))
          } else {
            this.lighting.setColor(def.id, parseInt(colorPicker.value.slice(1), 16))
          }
        })
      }

      if (def.pos) {
        const px = this.el.querySelector(`#sp-light-${def.id}-posx`)
        const py = this.el.querySelector(`#sp-light-${def.id}-posy`)
        const pz = this.el.querySelector(`#sp-light-${def.id}-posz`)
        if (px) px.value = def.posDefault.x
        if (py) py.value = def.posDefault.y
        if (pz) pz.value = def.posDefault.z
        const updatePos = () => {
          this.lighting.setPosition(def.id, parseFloat(px.value), parseFloat(py.value), parseFloat(pz.value))
        }
        if (px) px.addEventListener('input', updatePos)
        if (py) py.addEventListener('input', updatePos)
        if (pz) pz.addEventListener('input', updatePos)
      }
    })
  }

  _bindEnvironment() {
    const presetSelect = this.el.querySelector('#sp-env-preset')
    presetSelect.addEventListener('change', () => {
      this.environment.setEnvPreset(presetSelect.value)
    })

    const envInt = this.el.querySelector('#sp-env-intensity')
    envInt.addEventListener('input', () => {
      this.environment.setEnvIntensity(parseFloat(envInt.value))
    })
  }

  _bindMaterials() {
    const toggle = this.el.querySelector('#sp-mat-toggle')
    const rough = this.el.querySelector('#sp-mat-roughness')
    const metal = this.el.querySelector('#sp-mat-metalness')
    const envInt = this.el.querySelector('#sp-mat-envint')
    const color = this.el.querySelector('#sp-mat-color')
    const matSelect = this.el.querySelector('#sp-mat-select')
    const perMatControls = this.el.querySelector('#sp-permat-controls')
    const perRough = this.el.querySelector('#sp-permat-roughness')
    const perMetal = this.el.querySelector('#sp-permat-metalness')
    const perColor = this.el.querySelector('#sp-permat-color')

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active')
      this.materials.setEnabled(toggle.classList.contains('active'))
    })

    rough.addEventListener('input', () => this.materials.setGlobalRoughness(parseFloat(rough.value)))
    metal.addEventListener('input', () => this.materials.setGlobalMetalness(parseFloat(metal.value)))
    envInt.addEventListener('input', () => this.materials.setGlobalEnvIntensity(parseFloat(envInt.value)))
    color.addEventListener('input', () => this.materials.setGlobalColor(parseInt(color.value.slice(1), 16)))

    matSelect.addEventListener('change', () => {
      if (matSelect.value) {
        perMatControls.style.display = 'block'
      } else {
        perMatControls.style.display = 'none'
      }
    })

    perRough.addEventListener('input', () => {
      if (matSelect.value) this.materials.setPerMaterialOverride(matSelect.value, 'roughness', parseFloat(perRough.value))
    })
    perMetal.addEventListener('input', () => {
      if (matSelect.value) this.materials.setPerMaterialOverride(matSelect.value, 'metalness', parseFloat(perMetal.value))
    })
    perColor.addEventListener('input', () => {
      if (matSelect.value) this.materials.setPerMaterialOverride(matSelect.value, 'color', parseInt(perColor.value.slice(1), 16))
    })
  }

  _bindCamera() {
    const nameInput = this.el.querySelector('#sp-preset-name')
    const saveBtn = this.el.querySelector('#sp-save-preset')
    const selectEl = this.el.querySelector('#sp-preset-select')
    const delBtn = this.el.querySelector('#sp-del-preset')
    const exportBtn = this.el.querySelector('#sp-export-all')
    const dataEl = this.el.querySelector('#sp-cam-data')

    const refreshSelect = () => {
      selectEl.innerHTML = '<option value="">— presets —</option>'
      this.presets.getNames().forEach((name) => {
        const opt = document.createElement('option')
        opt.value = name
        opt.textContent = name
        selectEl.appendChild(opt)
      })
    }

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim()
      if (!name) return
      this.presets.save(name)
      nameInput.value = ''
      refreshSelect()
    })

    selectEl.addEventListener('change', () => {
      const name = selectEl.value
      if (!name) return
      this.presets.load(name)
    })

    delBtn.addEventListener('click', () => {
      const name = selectEl.value
      if (!name) return
      this.presets.delete(name)
      selectEl.value = ''
      refreshSelect()
    })

    exportBtn.addEventListener('click', () => {
      const json = this.presets.exportJSON()
      navigator.clipboard.writeText(json).catch(() => {})
      const orig = exportBtn.textContent
      exportBtn.textContent = 'Copied!'
      setTimeout(() => { exportBtn.textContent = orig }, 2000)
    })

    this._camDataEl = dataEl
    this._camRefresh = () => {
      const p = this.presets
      const pos = p.camera.position
      const tgt = p.controls.target
      dataEl.textContent =
        `pos: ${pos.x.toFixed(4)}, ${pos.y.toFixed(4)}, ${pos.z.toFixed(4)}\n` +
        `tgt: ${tgt.x.toFixed(4)}, ${tgt.y.toFixed(4)}, ${tgt.z.toFixed(4)}\n` +
        `fov: ${p.camera.fov.toFixed(1)}°\n` +
        `dist: ${pos.distanceTo(tgt).toFixed(4)}`
    }
  }

  _refreshMatSelect() {
    const select = this.el.querySelector('#sp-mat-select')
    select.innerHTML = '<option value="">— none —</option>'
    this.materials.getMaterialNames().forEach((name) => {
      const opt = document.createElement('option')
      opt.value = name
      opt.textContent = name
      select.appendChild(opt)
    })
  }

  _setupDrag() {
    const header = this.el.querySelector('#sp-header')
    let dragging = false, startX, startY, origX, origY

    header.addEventListener('mousedown', (e) => {
      dragging = true
      startX = e.clientX
      startY = e.clientY
      origX = this.el.offsetLeft
      origY = this.el.offsetTop
      this.el.style.cursor = 'grabbing'
      e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return
      this.el.style.left = `${origX + e.clientX - startX}px`
      this.el.style.top = `${origY + e.clientY - startY}px`
      this.el.style.right = 'auto'
    })

    document.addEventListener('mouseup', () => {
      if (!dragging) return
      dragging = false
      this.el.style.cursor = 'grab'
    })
  }

  update() {
    if (this.visible && this._camRefresh) {
      this._camRefresh()
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add ScenePanel with all UI controls and presets"
```

---

### Task 9: Rewrite main.js entry point

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Rewrite main.js**

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ModelLoader } from './modules/ModelLoader.js'
import { EnvironmentManager } from './modules/EnvironmentManager.js'
import { LightingManager } from './modules/LightingManager.js'
import { MaterialControls } from './modules/MaterialControls.js'
import { CameraPresets } from './modules/CameraPresets.js'
import { ScenePanel } from './modules/ScenePanel.js'

const container = document.getElementById('container-3d')

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(5, 3, 5)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
container.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0)
controls.enableDamping = false
controls.update()

const modelLoader = new ModelLoader(scene, renderer)
const environment = new EnvironmentManager(scene, renderer)
const lighting = new LightingManager(scene)
const materials = new MaterialControls()
const presets = new CameraPresets(camera, controls)

const panel = new ScenePanel({ modelLoader, environment, lighting, materials, presets })

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  panel.update()
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
```

- [ ] **Step 2: Verify it loads**

Run: `cd C:\Users\raghu\Desktop\mazda && npx vite`

Expected: Dev server starts, no console errors, Scene Controls panel visible on the right, white background.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: rewrite main.js entry point with modular architecture"
```

---

### Task 10: Test and polish

**Files:**
- Test manually via `npm run dev`

- [ ] **Step 1: Run dev server and verify all features**

```bash
cd C:\Users\raghu\Desktop\mazda && npx vite
```

Verify:
- Panel is draggable, collapsible
- Sections collapse/expand
- Background color picker works
- Ground toggles on/off
- Grid toggles
- Shadows toggle
- Env map preset switching
- All 6 light sliders and color pickers respond
- Model loads via drag-drop or file picker
- Material overrides work (global + per-material)
- Save camera preset with name → appears in dropdown
- Load preset → camera moves
- Export All → copies JSON to clipboard
- Delete preset works
- C key toggles panel

- [ ] **Step 2: Fix any issues found**

If something doesn't work, fix inline and re-test.

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: `dist/` folder created with static files.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: final polish and cleanup"
```
