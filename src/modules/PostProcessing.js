import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js'
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js'

const ColorAdjustShader = {
  uniforms: {
    tDiffuse: { value: null },
    brightness: { value: 0 },
    contrast: { value: 1 },
    saturation: { value: 1 },
    hue: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float hue;
    varying vec2 vUv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += brightness;
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      vec3 hsv = rgb2hsv(color.rgb);
      hsv.x = mod(hsv.x + hue, 1.0);
      color.rgb = hsv2rgb(hsv);
      float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(luma), color.rgb, saturation);
      gl_FragColor = color;
    }
  `
}

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 0.5 },
    darkness: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vignette = 1.0 - dot(uv, uv);
      color.rgb *= smoothstep(0.0, darkness, vignette);
      gl_FragColor = color;
    }
  `
}

const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.1 },
    size: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    uniform float size;
    varying vec2 vUv;

    float random(vec2 n) {
      return fract(sin(dot(n, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 grainUv = vUv * size;
      float noise = random(floor(grainUv * 500.0));
      float grain = mix(1.0 - intensity, 1.0 + intensity, noise);
      color.rgb *= grain;
      gl_FragColor = color;
    }
  `
}

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.enabled = false

    this.settings = {
      bloom: { enabled: false, strength: 0.5, radius: 0.5, threshold: 0.2 },
      color: { enabled: false, brightness: 0, contrast: 1, saturation: 1, hue: 0 },
      vignette: { enabled: false, offset: 0.5, darkness: 0.5 },
      grain: { enabled: false, intensity: 0.1, size: 1.0 },
      sao: { enabled: false, bias: 0.5, intensity: 0.18, scale: 1, kernelRadius: 100, blur: true, blurRadius: 8 },
      ssr: { enabled: false, opacity: 0.5, maxDistance: 180, thickness: 0.018 },
    }

    this.composer = null
    this.bloomPass = null
    this.colorPass = null
    this.vignettePass = null
    this.grainPass = null
    this.saoPass = null
    this.ssrPass = null

    this._init()
  }

  _init() {
    this.composer = new EffectComposer(this.renderer)

    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.saoPass = new SAOPass(this.scene, this.camera, new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5))
    Object.assign(this.saoPass.params, this.settings.sao)
    this.saoPass.enabled = false
    this.composer.addPass(this.saoPass)

    this.ssrPass = new SSRPass({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      width: window.innerWidth,
      height: window.innerHeight,
      selects: null,
      bouncing: false,
      groundReflector: null,
    })
    this.ssrPass.opacity = this.settings.ssr.opacity
    this.ssrPass.maxDistance = this.settings.ssr.maxDistance
    this.ssrPass.thickness = this.settings.ssr.thickness
    this.ssrPass.blur = true
    this.ssrPass.enabled = false
    this.composer.addPass(this.ssrPass)

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.settings.bloom.strength,
      this.settings.bloom.radius,
      this.settings.bloom.threshold
    )
    this.bloomPass.enabled = false
    this.composer.addPass(this.bloomPass)

    this.colorPass = new ShaderPass(ColorAdjustShader)
    this.colorPass.enabled = false
    this.composer.addPass(this.colorPass)

    this.grainPass = new ShaderPass(GrainShader)
    this.grainPass.enabled = false
    this.composer.addPass(this.grainPass)

    this.vignettePass = new ShaderPass(VignetteShader)
    this.vignettePass.enabled = false
    this.composer.addPass(this.vignettePass)

    this.composer.addPass(new OutputPass())

    this._resizeHandler = () => {
      if (this.composer) {
        this.composer.setSize(window.innerWidth, window.innerHeight)
        this.saoPass.resolution.set(window.innerWidth * 0.5, window.innerHeight * 0.5)
        this.ssrPass.width = window.innerWidth
        this.ssrPass.height = window.innerHeight
        this.ssrPass.beautyRenderTarget.setSize(window.innerWidth, window.innerHeight)
        this.ssrPass.normalRenderTarget.setSize(window.innerWidth, window.innerHeight)
        this.ssrPass.metalnessRenderTarget.setSize(window.innerWidth, window.innerHeight)
        this.ssrPass.ssrRenderTarget.setSize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', this._resizeHandler)
  }

  setEnabled(val) {
    this.enabled = val
  }

  setBloomEnabled(val) {
    this.settings.bloom.enabled = val
    this.bloomPass.enabled = val
  }

  setBloomStrength(val) {
    this.settings.bloom.strength = val
    this.bloomPass.strength = val
  }

  setBloomRadius(val) {
    this.settings.bloom.radius = val
    this.bloomPass.radius = val
  }

  setBloomThreshold(val) {
    this.settings.bloom.threshold = val
    this.bloomPass.threshold = val
  }

  setColorEnabled(val) {
    this.settings.color.enabled = val
    this.colorPass.enabled = val
  }

  setBrightness(val) {
    this.settings.color.brightness = val
    this.colorPass.uniforms.brightness.value = val
  }

  setContrast(val) {
    this.settings.color.contrast = val
    this.colorPass.uniforms.contrast.value = val
  }

  setSaturation(val) {
    this.settings.color.saturation = val
    this.colorPass.uniforms.saturation.value = val
  }

  setHue(val) {
    this.settings.color.hue = val
    this.colorPass.uniforms.hue.value = val
  }

  setVignetteEnabled(val) {
    this.settings.vignette.enabled = val
    this.vignettePass.enabled = val
  }

  setVignetteOffset(val) {
    this.settings.vignette.offset = val
    this.vignettePass.uniforms.offset.value = val
  }

  setVignetteDarkness(val) {
    this.settings.vignette.darkness = val
    this.vignettePass.uniforms.darkness.value = val
  }

  setGrainEnabled(val) {
    this.settings.grain.enabled = val
    this.grainPass.enabled = val
  }

  setGrainIntensity(val) {
    this.settings.grain.intensity = val
    this.grainPass.uniforms.intensity.value = val
  }

  setGrainSize(val) {
    this.settings.grain.size = val
    this.grainPass.uniforms.size.value = val
  }

  setSAOEnabled(val) {
    this.settings.sao.enabled = val
    this.saoPass.enabled = val
  }

  setSAOBias(val) {
    this.settings.sao.bias = val
    this.saoPass.params.saoBias = val
  }

  setSAOIntensity(val) {
    this.settings.sao.intensity = val
    this.saoPass.params.saoIntensity = val
  }

  setSAOScale(val) {
    this.settings.sao.scale = val
    this.saoPass.params.saoScale = val
  }

  setSAOKernelRadius(val) {
    this.settings.sao.kernelRadius = val
    this.saoPass.params.saoKernelRadius = val
  }

  setSSREnabled(val) {
    this.settings.ssr.enabled = val
    this.ssrPass.enabled = val
  }

  setSSROpacity(val) {
    this.settings.ssr.opacity = val
    this.ssrPass.opacity = val
  }

  setSSRMaxDistance(val) {
    this.settings.ssr.maxDistance = val
    this.ssrPass.maxDistance = val
  }

  setSSRThickness(val) {
    this.settings.ssr.thickness = val
    this.ssrPass.thickness = val
  }

  render() {
    if (this.enabled && this.composer) {
      this.composer.render()
      return true
    }
    return false
  }

  exportImage() {
    if (this.enabled && this.composer) {
      this.composer.render()
    }
    const dataURL = this.renderer.domElement.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'mazda-export.png'
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  toJSON() {
    return {
      enabled: this.enabled,
      bloom: { ...this.settings.bloom },
      color: { ...this.settings.color },
      vignette: { ...this.settings.vignette },
      grain: { ...this.settings.grain },
      sao: { ...this.settings.sao },
      ssr: { ...this.settings.ssr },
    }
  }

  fromJSON(data) {
    if (!data) return
    this.enabled = data.enabled ?? false

    if (data.bloom) Object.assign(this.settings.bloom, data.bloom)
    if (data.color) Object.assign(this.settings.color, data.color)
    if (data.vignette) Object.assign(this.settings.vignette, data.vignette)
    if (data.grain) Object.assign(this.settings.grain, data.grain)
    if (data.sao) Object.assign(this.settings.sao, data.sao)
    if (data.ssr) Object.assign(this.settings.ssr, data.ssr)

    this.setBloomEnabled(this.settings.bloom.enabled)
    this.bloomPass.strength = this.settings.bloom.strength
    this.bloomPass.radius = this.settings.bloom.radius
    this.bloomPass.threshold = this.settings.bloom.threshold

    this.setColorEnabled(this.settings.color.enabled)
    this.colorPass.uniforms.brightness.value = this.settings.color.brightness
    this.colorPass.uniforms.contrast.value = this.settings.color.contrast
    this.colorPass.uniforms.saturation.value = this.settings.color.saturation
    this.colorPass.uniforms.hue.value = this.settings.color.hue

    this.setVignetteEnabled(this.settings.vignette.enabled)
    this.vignettePass.uniforms.offset.value = this.settings.vignette.offset
    this.vignettePass.uniforms.darkness.value = this.settings.vignette.darkness

    this.setGrainEnabled(this.settings.grain.enabled)
    this.grainPass.uniforms.intensity.value = this.settings.grain.intensity
    this.grainPass.uniforms.size.value = this.settings.grain.size

    this.setSAOEnabled(this.settings.sao.enabled)
    this.saoPass.params.saoBias = this.settings.sao.bias
    this.saoPass.params.saoIntensity = this.settings.sao.intensity
    this.saoPass.params.saoScale = this.settings.sao.scale
    this.saoPass.params.saoKernelRadius = this.settings.sao.kernelRadius

    this.setSSREnabled(this.settings.ssr.enabled)
    this.ssrPass.opacity = this.settings.ssr.opacity
    this.ssrPass.maxDistance = this.settings.ssr.maxDistance
    this.ssrPass.thickness = this.settings.ssr.thickness
  }

  dispose() {
    window.removeEventListener('resize', this._resizeHandler)
    if (this.composer) {
      this.composer.dispose()
      this.composer = null
    }
  }
}
