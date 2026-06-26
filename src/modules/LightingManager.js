import * as THREE from 'three'

let _counter = 0

export class LightingManager {
  constructor(scene) {
    this.scene = scene
    this.lights = {}
  }

  addLight(type, config = {}) {
    const id = `lgt-${_counter++}`
    let light

    switch (type) {
      case 'ambient':
        light = new THREE.AmbientLight(config.color || 0xffffff, config.intensity ?? 1)
        break
      case 'directional':
        light = new THREE.DirectionalLight(config.color || 0xffffff, config.intensity ?? 1)
        light.position.set(config.x ?? 0, config.y ?? 5, config.z ?? 0)
        break
      case 'point':
        light = new THREE.PointLight(config.color || 0xffffff, config.intensity ?? 1, 30)
        light.position.set(config.x ?? 0, config.y ?? 3, config.z ?? 0)
        break
      case 'spot':
        light = new THREE.SpotLight(config.color || 0xffffff, config.intensity ?? 1, 30, Math.PI / 4, 0.5)
        light.position.set(config.x ?? 0, config.y ?? 5, config.z ?? 0)
        break
      case 'hemisphere':
        light = new THREE.HemisphereLight(config.color || 0x87ceeb, config.groundColor || 0x362d24, config.intensity ?? 1)
        break
      default:
        return null
    }

    light.name = id
    this.scene.add(light)
    this.lights[id] = { type, light }
    return id
  }

  removeLight(id) {
    const entry = this.lights[id]
    if (!entry) return
    this.scene.remove(entry.light)
    if (entry.light.dispose) entry.light.dispose()
    delete this.lights[id]
  }

  updateIntensity(id, value) {
    if (this.lights[id]) this.lights[id].light.intensity = value
  }

  updateColor(id, hex) {
    if (this.lights[id]) this.lights[id].light.color.setHex(hex)
  }

  updatePosition(id, x, y, z) {
    const entry = this.lights[id]
    if (entry && entry.light.position) entry.light.position.set(x, y, z)
  }

  updateGroundColor(hex) {
    const hemi = Object.values(this.lights).find((e) => e.type === 'hemisphere')
    if (hemi) hemi.light.groundColor.setHex(hex)
  }

  clearAll() {
    Object.keys(this.lights).forEach((id) => this.removeLight(id))
  }

  getAll() {
    return Object.entries(this.lights).map(([id, entry]) => ({ id, type: entry.type, light: entry.light }))
  }
}
