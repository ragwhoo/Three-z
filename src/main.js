import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { CameraDebugger } from './utils/CameraDebugger.js'

const container = document.getElementById('container-3d')
let model, modelLoaded = false
const X_OFFSET = 0

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(-7.728778, -0.750973, -1.395258)
camera.rotation.set(-1.712438, -1.561676, -1.712444)

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362d24, 0)
scene.add(hemiLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0)
directionalLight.position.set(5, 8, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 20
directionalLight.shadow.camera.left = -8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.bottom = -8
directionalLight.shadow.bias = -0.0005
directionalLight.shadow.normalBias = 0.02
directionalLight.shadow.radius = 4
scene.add(directionalLight)

const fillLight = new THREE.DirectionalLight(0x4488ff, 0)
fillLight.position.set(-4, 2, -3)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight(0xff8844, 0)
rimLight.position.set(-2, 1, -5)
scene.add(rimLight)

setTimeout(() => {
  gsap.to(rimLight, { intensity: 0.6, duration: 0.8, ease: 'power2.out' })
  gsap.to(fillLight, { intensity: 0.8, duration: 0.8, ease: 'power2.out', delay: 0.3 })
  gsap.to(directionalLight, { intensity: 2.5, duration: 1, ease: 'power2.out', delay: 0.6 })
  gsap.to(hemiLight, { intensity: 0.8, duration: 0.8, ease: 'power2.out', delay: 0.9 })
}, 1500)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(-0.083563, -0.820000, -1.385415)
controls.update()
controls.enableDamping = false
controls.minDistance = 0
controls.maxDistance = Infinity

const debugger_ = new CameraDebugger({ camera, controls, renderer })

const pmremGenerator = new THREE.PMREMGenerator(renderer)
const envScene = new THREE.Scene()
envScene.background = new THREE.Color(0x222233)
const envLight1 = new THREE.DirectionalLight(0xffaa66, 1.5)
envLight1.position.set(2, 3, 4)
envScene.add(envLight1)
const envLight2 = new THREE.DirectionalLight(0x6688ff, 1.5)
envLight2.position.set(-3, -1, -2)
envScene.add(envLight2)
const envMap = pmremGenerator.fromScene(envScene).texture
scene.environment = envMap
pmremGenerator.dispose()

const groundGeom = new THREE.CircleGeometry(12, 64)
groundGeom.rotateX(-Math.PI / 2)
const groundMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.9, metalness: 0 })
const ground = new THREE.Mesh(groundGeom, groundMat)
ground.position.y = -2
ground.receiveShadow = true
scene.add(ground)

const loader = new GLTFLoader()
loader.load(
  '/mazda_rx-7_car.glb',
  (gltf) => {
    model = gltf.scene
    model.position.set(X_OFFSET, 0, 0)
    model.rotation.y = Math.PI
    scene.add(model)

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          mat.envMapIntensity = 1.5
          mat.roughness = Math.max(mat.roughness, 0.3)
          mat.metalness = Math.max(mat.metalness, 0.2)
          mat.needsUpdate = true
        })
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    if (gltf.animations.length > 0) {
      window.__mixer = new THREE.AnimationMixer(model)
      window.__animAction = window.__mixer.clipAction(gltf.animations[0])
      window.__animAction.play()
      window.__modelAnimationsEnabled = true
    }

    modelLoaded = true
  },
  (xhr) => {
    const percent = (xhr.loaded / xhr.total) * 100
    if (percent < 100) console.log(`Loading: ${Math.round(percent)}%`)
  },
  (error) => {
    console.error('Error loading model:', error)
  }
)

const sectionTransitions = [
  {
    id: 'hero',
    position: { x: X_OFFSET, y: 0, z: 0 },
    rotation: { x: 0, y: Math.PI, z: 0 },
    camera: {
      position: { x: -7.728778, y: -0.750973, z: -1.395258 },
      rotation: { x: -1.712438, y: -1.561676, z: -1.712444 },
      target: { x: -0.083563, y: -0.820000, z: -1.385415 },
    },
  },
  {
    id: 'intro',
    position: { x: 2.5 + X_OFFSET, y: -0.5, z: -1 },
    rotation: { x: 0, y: Math.PI * 0.6, z: 0 },
    camera: {
      position: { x: 7.069251, y: -1.783964, z: -4.048179 },
      rotation: { x: 2.754620, y: 1.234719, z: -2.774326 },
      target: { x: 0.212333, y: -0.880000, z: -1.829976 },
    },
  },
  {
    id: 'rotary',
    position: { x: -2 + X_OFFSET, y: -0.3, z: 0.5 },
    rotation: { x: 0.1, y: Math.PI * 1.4, z: 0 },
    camera: {
      position: { x: -5.498554, y: -1.676017, z: -1.039401 },
      rotation: { x: -3.022210, y: 0.440674, z: 3.090471 },
      target: { x: -6.068692, y: -1.820000, z: 0.160926 },
    },
  },
  {
    id: 'design',
    position: { x: X_OFFSET, y: 0, z: -1.5 },
    rotation: { x: -0.05, y: Math.PI * 0.8, z: 0 },
    camera: {
      position: { x: -0.115026, y: -0.232186, z: -9.125352 },
      rotation: { x: -2.859787, y: -0.132948, z: -3.103235 },
      target: { x: 0.071478, y: -0.620000, z: -7.785800 },
    },
  },
  {
    id: 'generations',
    position: { x: -1.5 + X_OFFSET, y: -0.2, z: 1 },
    rotation: { x: 0, y: Math.PI * 1.2, z: 0.05 },
    camera: {
      position: { x: -4.736334, y: 6.966977, z: 1.281971 },
      rotation: { x: -1.570796, y: 0.000001, z: 0.632850 },
      target: { x: -4.736335, y: 5.560000, z: 1.281970 },
    },
  },
  {
    id: 'culture',
    position: { x: 1.5 + X_OFFSET, y: -0.1, z: -0.5 },
    rotation: { x: 0.05, y: Math.PI * 0.4, z: 0 },
    camera: {
      position: { x: 7.508443, y: 0.070973, z: 0.078898 },
      rotation: { x: -0.495405, y: 0.337226, z: 0.176917 },
      target: { x: 7.500350, y: 0.060000, z: 0.058591 },
    },
  },
  {
    id: 'legacy',
    position: { x: X_OFFSET, y: 0.3, z: 2 },
    rotation: { x: -0.1, y: Math.PI, z: 0 },
  },
  {
    id: 'specs',
    position: { x: 2 + X_OFFSET, y: -0.4, z: 0 },
    rotation: { x: 0, y: Math.PI * 0.3, z: 0 },
  },
  {
    id: 'footer',
    position: { x: X_OFFSET, y: 0.3, z: 2 },
    rotation: { x: -0.1, y: Math.PI, z: 0 },
    camera: {
      position: { x: -2.825442, y: -0.070392, z: 4.694761 },
      rotation: { x: -0.280153, y: 0.013860, z: 0.003988 },
      target: { x: -2.862018, y: -0.800000, z: 2.158937 },
    },
  },
]

const _p1 = new THREE.Vector3()
const _p2 = new THREE.Vector3()
const _mid = new THREE.Vector3()
const _off = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _side = new THREE.Vector3()

function animateCameraTo(toPos, toTarget) {
  const fromPos = _p1.copy(camera.position)
  const fromTarget = _p2.copy(controls.target)

  _mid.addVectors(fromPos, toPos).multiplyScalar(0.5)
  const distToOrigin = _mid.length()
  const nearModel = Math.max(0, 4 - distToOrigin)

  _dir.copy(toPos).sub(fromPos)
  _dir.y = 0
  _dir.normalize()

  _side.crossVectors(_dir, new THREE.Vector3(0, 1, 0)).normalize()

  _off.copy(_mid)
  _off.y = 0
  const hDist = _off.length()
  if (hDist > 0.01) _off.normalize()
  else _off.set(1, 0, 0)

  const sideWeight = 0.5 + nearModel * 0.1
  const awayWeight = 1 - sideWeight
  const horizDir = new THREE.Vector3()
    .addScaledVector(_side, sideWeight)
    .addScaledVector(_off, awayWeight)
    .normalize()

  const avgY = (fromPos.y + toPos.y) / 2
  const upAmount = Math.max(0.5, 3 - avgY * 0.3)
  const pushAmount = 1.5 + nearModel * 0.5

  const control = _mid.clone()
  control.x += horizDir.x * pushAmount
  control.z += horizDir.z * pushAmount
  control.y += upAmount * pushAmount

  const curve = new THREE.CatmullRomCurve3([fromPos, control, toPos])

  const state = { t: 0 }
  gsap.to(state, {
    t: 1,
    duration: 1.2,
    ease: 'power2.out',
    overwrite: 'auto',
    onUpdate: () => {
      curve.getPoint(state.t, camera.position)
      controls.target.lerpVectors(fromTarget, toTarget, state.t)
      controls.update()
    },
  })
}

let currentSectionId = null

function moveModel() {
  if (!modelLoaded || !model) return

  const sections = document.querySelectorAll('.section')
  const viewportHeight = window.innerHeight
  let activeId = null

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect()
    if (rect.top < viewportHeight * 0.66) {
      activeId = section.id
    }
  })

  if (!activeId || activeId === currentSectionId) return
  currentSectionId = activeId

  const transitionIndex = sectionTransitions.findIndex((t) => t.id === activeId)
  if (transitionIndex < 0) return

  const target = sectionTransitions[transitionIndex]

  gsap.to(model.position, {
    x: target.position.x,
    y: target.position.y,
    z: target.position.z,
    duration: 1.2,
    ease: 'power2.out',
    overwrite: 'auto',
  })

  gsap.to(model.rotation, {
    x: target.rotation.x,
    y: target.rotation.y,
    z: target.rotation.z,
    duration: 1.2,
    ease: 'power2.out',
    overwrite: 'auto',
  })

  if (target.camera) {
    animateCameraTo(
      new THREE.Vector3(target.camera.position.x, target.camera.position.y, target.camera.position.z),
      new THREE.Vector3(target.camera.target.x, target.camera.target.y, target.camera.target.z),
    )
  }
}

window.addEventListener('scroll', moveModel)

const keys = {}
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true })
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false })

let animToggleVisible = false
const animToggleEl = document.createElement('div')
animToggleEl.id = 'anim-toggle'
animToggleEl.innerHTML = '<span>Model Animations</span><button id="anim-toggle-btn">ON</button>'
Object.assign(animToggleEl.style, {
  position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
  zIndex: '99999', display: 'none',
  fontFamily: "'Inter', system-ui, sans-serif", fontSize: '12px',
  color: '#e0e0e0', background: 'rgba(10,10,15,0.9)',
  backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '8px 16px',
  alignItems: 'center', gap: '12px',
})
const toggleBtn = animToggleEl.querySelector('#anim-toggle-btn')
Object.assign(toggleBtn.style, {
  padding: '4px 12px', fontSize: '11px', fontWeight: '600', fontFamily: 'inherit',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
  cursor: 'pointer', background: 'rgba(46,204,113,0.2)', color: '#2ecc71',
})
toggleBtn.addEventListener('click', () => {
  window.__modelAnimationsEnabled = !window.__modelAnimationsEnabled
  if (window.__animAction) {
    if (window.__modelAnimationsEnabled) {
      window.__animAction.play()
    } else {
      window.__animAction.stop()
    }
  }
  toggleBtn.textContent = window.__modelAnimationsEnabled ? 'ON' : 'OFF'
  toggleBtn.style.background = window.__modelAnimationsEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'
  toggleBtn.style.color = window.__modelAnimationsEnabled ? '#2ecc71' : '#e74c3c'
  toggleBtn.style.borderColor = window.__modelAnimationsEnabled ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)'
})
document.body.appendChild(animToggleEl)

let scrollLocked = true
const scrollLockEl = document.createElement('div')
scrollLockEl.id = 'scroll-lock-indicator'
scrollLockEl.textContent =  'Scroll: OFF (6 to toggle)'
Object.assign(scrollLockEl.style, {
  position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
  zIndex: '99999', display: 'none',
  fontFamily: "'Inter', system-ui, sans-serif", fontSize: '12px',
  color: '#e0e0e0', background: 'rgba(10,10,15,0.9)',
  backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '8px 16px', whiteSpace: 'nowrap',
})
document.body.appendChild(scrollLockEl)

function applyScrollLock(locked) {
  document.body.style.overflowY = locked ? 'hidden' : ''
  controls.enableZoom = locked
}

applyScrollLock(true)

document.addEventListener('keydown', (e) => {
  if (e.key === '5' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
    animToggleVisible = !animToggleVisible
    animToggleEl.style.display = animToggleVisible ? 'flex' : 'none'
  }
  if (e.key === '6' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
    scrollLocked = !scrollLocked
    applyScrollLock(scrollLocked)
    scrollLockEl.style.display = 'flex'
    scrollLockEl.textContent = scrollLocked ? 'Scroll: OFF (6 to toggle)' : 'Scroll: ON (6 to toggle)'
    clearTimeout(scrollLockEl._hideTimer)
    scrollLockEl._hideTimer = setTimeout(() => { scrollLockEl.style.display = 'none' }, 2000)
  }
})

const groundSlider = document.createElement('div')
groundSlider.innerHTML = '<span style="font-size:10px;color:rgba(255,255,255,0.5)">Ground</span><input type="range" min="-5" max="0" step="0.001" value="-2" style="width:120px;cursor:pointer">'
Object.assign(groundSlider.style, {
  position: 'fixed', bottom: '24px', right: '24px', zIndex: '99999',
  display: 'flex', alignItems: 'center', gap: '8px',
  fontFamily: "'Inter', system-ui, sans-serif", fontSize: '12px',
  color: '#e0e0e0', background: 'rgba(10,10,15,0.85)',
  backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '8px 12px',
})
groundSlider.querySelector('input').addEventListener('input', (e) => {
  ground.position.y = parseFloat(e.target.value)
})
document.body.appendChild(groundSlider)

window.addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
})

const MOVE_SPEED = 0.02

function animate() {
  requestAnimationFrame(animate)

  if (keys['w'] || keys['arrowup']) {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()
    camera.position.addScaledVector(dir, MOVE_SPEED)
    controls.target.addScaledVector(dir, MOVE_SPEED)
  }
  if (keys['s'] || keys['arrowdown']) {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()
    camera.position.addScaledVector(dir, -MOVE_SPEED)
    controls.target.addScaledVector(dir, -MOVE_SPEED)
  }
  if (keys['a'] || keys['arrowleft']) {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize()
    camera.position.addScaledVector(right, -MOVE_SPEED)
    controls.target.addScaledVector(right, -MOVE_SPEED)
  }
  if (keys['d'] || keys['arrowright']) {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize()
    camera.position.addScaledVector(right, MOVE_SPEED)
    controls.target.addScaledVector(right, MOVE_SPEED)
  }
  if (keys['q']) {
    camera.position.y -= MOVE_SPEED
    controls.target.y -= MOVE_SPEED
  }
  if (keys['e']) {
    camera.position.y += MOVE_SPEED
    controls.target.y += MOVE_SPEED
  }

  if (window.__mixer && window.__modelAnimationsEnabled) {
    window.__mixer.update(0.016)
  }

  controls.update()

  renderer.render(scene, camera)
}

animate()
