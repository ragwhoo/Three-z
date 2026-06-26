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
