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

  setGroundHeight(y) {
    this.ground.position.y = y
    if (this.grid) this.grid.position.y = y + 0.001
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
