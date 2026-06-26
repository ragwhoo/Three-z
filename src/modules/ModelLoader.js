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
