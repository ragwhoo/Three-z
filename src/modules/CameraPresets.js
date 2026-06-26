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
