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

  getMaterialsMap() {
    const map = {}
    if (!this.model) return map
    this.model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          if (mat.name && !map[mat.name]) {
            map[mat.name] = {
              color: mat.color ? mat.color.getHex() : 0xffffff,
              roughness: mat.roughness,
              metalness: mat.metalness,
              envIntensity: mat.envMapIntensity,
            }
          }
        })
      }
    })
    return map
  }
}
