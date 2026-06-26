import * as THREE from 'three'

let _counter = 0

export class LightingManager {
  constructor(scene, camera, renderer, controls) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.controls = controls
    this.lights = {}
    this.helpers = {}
    this._dragging = null
    this._dragPlane = new THREE.Plane()
    this._dragOffset = new THREE.Vector3()
    this._dragIntersect = new THREE.Vector3()
    this._raycaster = new THREE.Raycaster()
    this._mouse = new THREE.Vector2()
    this.onPositionChange = null

    this._setupDrag()
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
        light.castShadow = true
        light.shadow.mapSize.width = 2048
        light.shadow.mapSize.height = 2048
        light.shadow.camera.near = 0.1
        light.shadow.camera.far = 30
        light.shadow.camera.left = -10
        light.shadow.camera.right = 10
        light.shadow.camera.top = 10
        light.shadow.camera.bottom = -10
        light.shadow.bias = -0.001
        light.shadow.normalBias = 0.02
        light.shadow.radius = 4
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
    this._createHelper(id, type, light)
    return id
  }

  removeLight(id) {
    const entry = this.lights[id]
    if (!entry) return
    this.scene.remove(entry.light)
    if (entry.light.dispose) entry.light.dispose()
    delete this.lights[id]
    this._removeHelper(id)
  }

  updateIntensity(id, value) {
    if (this.lights[id]) {
      this.lights[id].light.intensity = value
      this._updateHelperScale(id)
    }
  }

  updateColor(id, hex) {
    if (this.lights[id]) {
      this.lights[id].light.color.setHex(hex)
      this._updateHelperColor(id)
    }
  }

  updatePosition(id, x, y, z) {
    const entry = this.lights[id]
    if (entry && entry.light.position) {
      entry.light.position.set(x, y, z)
      this._updateHelperPos(id)
    }
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

  toJSON() {
    return Object.entries(this.lights).map(([id, entry]) => {
      const l = entry.light
      const data = { id, type: entry.type, intensity: l.intensity, color: l.color.getHex() }
      if (l.position) {
        data.position = [l.position.x, l.position.y, l.position.z]
      }
      if (entry.type === 'hemisphere' && l.groundColor) {
        data.groundColor = l.groundColor.getHex()
      }
      return data
    })
  }

  fromJSON(data) {
    if (!Array.isArray(data)) return
    data.forEach((item) => {
      const config = {
        intensity: item.intensity,
        color: item.color,
        x: item.position?.[0],
        y: item.position?.[1],
        z: item.position?.[2],
        groundColor: item.groundColor,
      }
      this.addLight(item.type, config)
    })
  }

  getHelper(id) {
    return this.helpers[id]
  }

  _createHelper(id, type, light) {
    if (type === 'ambient' || type === 'hemisphere') return
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.7 })
    )
    sphere.position.copy(light.position)
    sphere.userData.lightId = id
    sphere.userData.isLightHelper = true
    this.scene.add(sphere)
    this.helpers[id] = sphere
    this._updateHelperColor(id)
    this._updateHelperScale(id)
  }

  _updateHelperColor(id) {
    const helper = this.helpers[id]
    const entry = this.lights[id]
    if (helper && entry) {
      helper.material.color.copy(entry.light.color)
    }
  }

  _updateHelperScale(id) {
    const helper = this.helpers[id]
    const entry = this.lights[id]
    if (helper && entry) {
      const s = 0.12 + entry.light.intensity * 0.06
      helper.scale.setScalar(s / 0.15)
    }
  }

  _updateHelperPos(id) {
    const helper = this.helpers[id]
    const entry = this.lights[id]
    if (helper && entry) {
      helper.position.copy(entry.light.position)
    }
  }

  _removeHelper(id) {
    const h = this.helpers[id]
    if (h) {
      this.scene.remove(h)
      if (h.material) h.material.dispose()
      if (h.geometry) h.geometry.dispose()
      delete this.helpers[id]
    }
  }

  setHelpersVisible(visible) {
    Object.values(this.helpers).forEach((h) => (h.visible = visible))
  }

  _setupDrag() {
    const el = this.renderer.domElement

    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect()
      this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      this._raycaster.setFromCamera(this._mouse, this.camera)
      const targets = Object.values(this.helpers)
      const hits = this._raycaster.intersectObjects(targets)

      if (hits.length > 0) {
        const obj = hits[0].object
        this._dragging = obj.userData.lightId
        if (this.controls) this.controls.enabled = false

        this._dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()).negate(),
          obj.position
        )
        const hit = new THREE.Vector3()
        if (this._raycaster.ray.intersectPlane(this._dragPlane, hit)) {
          this._dragOffset.copy(hit).sub(obj.position)
        }
        el.style.cursor = 'grabbing'
        e.preventDefault()
      }
    })

    el.addEventListener('pointermove', (e) => {
      if (!this._dragging) return
      const rect = el.getBoundingClientRect()
      this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      this._raycaster.setFromCamera(this._mouse, this.camera)
      this._raycaster.ray.intersectPlane(this._dragPlane, this._dragIntersect)
      if (!this._dragIntersect) return

      const pos = this._dragIntersect.clone().sub(this._dragOffset)
      this.updatePosition(this._dragging, pos.x, pos.y, pos.z)
      if (this.onPositionChange) this.onPositionChange(this._dragging, pos.x, pos.y, pos.z)
    })

    el.addEventListener('pointerup', () => {
      if (this._dragging) {
        if (this.controls) this.controls.enabled = true
        this._dragging = null
        this.renderer.domElement.style.cursor = ''
      }
    })
  }
}
