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
lighting.addLight('ambient', { color: 0xffffff, intensity: 0.5 })
lighting.addLight('directional', { color: 0xffffff, intensity: 2, x: 5, y: 8, z: 5 })
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
