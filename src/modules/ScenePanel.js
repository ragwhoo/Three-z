export class ScenePanel {
  constructor({ modelLoader, environment, lighting, materials, presets }) {
    this.modelLoader = modelLoader
    this.environment = environment
    this.lighting = lighting
    this.materials = materials
    this.presets = presets

    this.visible = true
    this.collapsed = false
    this.sections = {}

    this.defaults = {
      camera: { pos: [5, 3, 5], target: [0, 0, 0], fov: 45 },
      bg: '#f0f0f0',
      ground: { visible: true, color: '#f5f5f5' },
      grid: false,
      shadows: true,
      env: { preset: 'studio', intensity: 1 },
      lights: {
        ambient: { int: 0.4, color: '#ffffff' },
        hemi: { int: 0.8, color: '#87ceeb' },
        'hemi-gnd': { int: 0.8, color: '#362d24' },
        key: { int: 2.5, color: '#ffffff', pos: { x: 5, y: 8, z: 5 } },
        fill: { int: 0.8, color: '#4488ff', pos: { x: -4, y: 2, z: -3 } },
        rim: { int: 0.6, color: '#ff8844', pos: { x: -2, y: 1, z: -5 } },
      },
      mat: { enabled: false, roughness: 0.4, metalness: 0.3, envInt: 1, color: '#cccccc' },
    }

    this._build()
    this._bind()
    this._setupDrag()
  }

  _build() {
    this.el = document.createElement('div')
    this.el.id = 'sp-panel'
    this.el.innerHTML = `
      <div id="sp-header">
        <span id="sp-title">Scene Controls</span>
        <span id="sp-collapse">−</span>
      </div>
      <div id="sp-body" class="sp-body">
        ${this._modelSection()}
        ${this._sceneSection()}
        ${this._lightingSection()}
        ${this._environmentSection()}
        ${this._materialSection()}
        ${this._cameraSection()}
        <div style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.06)">
          <button class="sp-btn danger" id="sp-reset-btn" style="width:100%">Reset All to Defaults</button>
        </div>
      </div>`
    document.body.appendChild(this.el)

    this.bodyEl = this.el.querySelector('#sp-body')
    this.collapseBtn = this.el.querySelector('#sp-collapse')
  }

  _modelSection() {
    return `
      <div class="sp-section" data-section="model">
        <div class="sp-section-header">
          Model
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-model">
          <div id="drop-zone">
            Drop a .glb or .gltf file here<br/>
            <span style="font-size:10px;color:#bbb">or</span><br/>
            <button class="sp-btn sp-file-btn" style="margin-top:4px">
              Choose Model
              <input type="file" id="sp-file-input" accept=".glb,.gltf" />
            </button>
          </div>
          <div id="sp-model-name"></div>
        </div>
      </div>`
  }

  _sceneSection() {
    return `
      <div class="sp-section" data-section="scene">
        <div class="sp-section-header">
          Scene
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-scene">
          <div class="sp-row">
            <span class="sp-label">Background</span>
            <input type="color" id="sp-bg-color" value="#f0f0f0" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Ground</span>
            <span style="display:flex;align-items:center;gap:6px">
              <div class="sp-toggle active" id="sp-ground-toggle"></div>
              <input type="color" id="sp-ground-color" value="#f5f5f5" style="width:20px;height:20px" />
            </span>
          </div>
          <div class="sp-row">
            <span class="sp-label">Grid</span>
            <div class="sp-toggle" id="sp-grid-toggle"></div>
          </div>
          <div class="sp-row">
            <span class="sp-label">Shadows</span>
            <div class="sp-toggle active" id="sp-shadows-toggle"></div>
          </div>
        </div>
      </div>`
  }

  _lightingSection() {
    const lights = [
      { id: 'ambient', label: 'Ambient', hasColor: true, hasPos: false },
      { id: 'hemi', label: 'Hemi Sky', hasColor: true, hasPos: false },
      { id: 'hemi-gnd', label: 'Hemi Gnd', hasColor: true, hasPos: false },
      { id: 'key', label: 'Key', hasColor: true, hasPos: true },
      { id: 'fill', label: 'Fill', hasColor: true, hasPos: true },
      { id: 'rim', label: 'Rim', hasColor: true, hasPos: true },
    ]
    let html = `
      <div class="sp-section" data-section="lighting">
        <div class="sp-section-header">
          Lighting
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-lighting">`
    lights.forEach((l) => {
      html += `
        <div class="sp-row">
          <span class="sp-label">${l.label}</span>
          <span style="display:flex;align-items:center;gap:4px">
            <input type="range" min="0" max="5" step="0.01" value="0" id="sp-light-${l.id}-int" style="width:60px" />
            ${l.hasColor ? `<input type="color" id="sp-light-${l.id}-color" value="#ffffff" style="width:20px;height:20px" />` : ''}
            ${l.hasPos ? `<span style="font-size:9px;color:#999">XYZ</span>` : ''}
          </span>
        </div>`
      if (l.hasPos) {
        html += `
        <div class="sp-row" style="padding-left:64px">
          <span style="display:flex;gap:4px;width:100%">
            <input type="range" min="-10" max="10" step="0.1" value="0" id="sp-light-${l.id}-posx" style="width:28px" />
            <input type="range" min="-10" max="10" step="0.1" value="0" id="sp-light-${l.id}-posy" style="width:28px" />
            <input type="range" min="-10" max="10" step="0.1" value="0" id="sp-light-${l.id}-posz" style="width:28px" />
          </span>
        </div>`
      }
    })
    html += `</div></div>`
    return html
  }

  _environmentSection() {
    return `
      <div class="sp-section" data-section="env">
        <div class="sp-section-header">
          Environment
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-env">
          <div class="sp-row">
            <span class="sp-label">Preset</span>
            <select id="sp-env-preset" style="width:120px">
              <option value="studio">Studio</option>
              <option value="outdoor">Outdoor Sunny</option>
              <option value="garage">Garage</option>
              <option value="moody">Night Neon</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div class="sp-row">
            <span class="sp-label">Intensity</span>
            <input type="range" min="0" max="5" step="0.01" value="1" id="sp-env-intensity" style="width:80px" />
          </div>
        </div>
      </div>`
  }

  _materialSection() {
    return `
      <div class="sp-section" data-section="mat">
        <div class="sp-section-header">
          Materials
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-mat">
          <div class="sp-row">
            <span class="sp-label">Override</span>
            <div class="sp-toggle" id="sp-mat-toggle"></div>
          </div>
          <div class="sp-row">
            <span class="sp-label">Roughness</span>
            <input type="range" min="0" max="1" step="0.01" value="0.4" id="sp-mat-roughness" style="width:80px" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Metalness</span>
            <input type="range" min="0" max="1" step="0.01" value="0.3" id="sp-mat-metalness" style="width:80px" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Env Int</span>
            <input type="range" min="0" max="5" step="0.01" value="1" id="sp-mat-envint" style="width:80px" />
          </div>
          <div class="sp-row">
            <span class="sp-label">Color</span>
            <input type="color" id="sp-mat-color" value="#cccccc" style="width:20px;height:20px" />
          </div>
          <div class="sp-sep"></div>
          <div class="sp-row">
            <span class="sp-label">Per Mat</span>
            <select id="sp-mat-select" style="width:120px">
              <option value="">— none —</option>
            </select>
          </div>
          <div id="sp-permat-controls" style="display:none">
            <div class="sp-row">
              <span class="sp-label">Roughness</span>
              <input type="range" min="0" max="1" step="0.01" value="0.4" id="sp-permat-roughness" style="width:80px" />
            </div>
            <div class="sp-row">
              <span class="sp-label">Metalness</span>
              <input type="range" min="0" max="1" step="0.01" value="0.3" id="sp-permat-metalness" style="width:80px" />
            </div>
            <div class="sp-row">
              <span class="sp-label">Color</span>
              <input type="color" id="sp-permat-color" value="#cccccc" style="width:20px;height:20px" />
            </div>
          </div>
        </div>
      </div>`
  }

  _cameraSection() {
    return `
      <div class="sp-section" data-section="cam">
        <div class="sp-section-header">
          Camera
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-cam">
          <div id="sp-cam-data">No data</div>
          <div class="sp-sep"></div>
          <div class="sp-preset-row">
            <input type="text" id="sp-preset-name" placeholder="Preset name..." />
            <button class="sp-btn sm" id="sp-save-preset">Save</button>
          </div>
          <div class="sp-preset-row">
            <select id="sp-preset-select" style="flex:1"><option value="">— presets —</option></select>
            <button class="sp-btn sm danger" id="sp-del-preset">Del</button>
          </div>
          <div class="sp-sep"></div>
          <button class="sp-btn primary" id="sp-export-all" style="width:100%">Export All as JSON</button>
        </div>
      </div>`
  }

  _bind() {
    this._bindToggleVisibility()
    this._bindCollapse()
    this._bindSectionToggles()

    this._bindModel()
    this._bindScene()
    this._bindLighting()
    this._bindEnvironment()
    this._bindMaterials()
    this._bindCamera()
    this._bindReset()
  }

  _bindToggleVisibility() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        this.visible = !this.visible
        this.el.style.display = this.visible ? 'block' : 'none'
      }
    })
  }

  _bindCollapse() {
    this.collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.collapsed = !this.collapsed
      this.bodyEl.style.display = this.collapsed ? 'none' : 'block'
      this.collapseBtn.textContent = this.collapsed ? '+' : '−'
    })
  }

  _bindSectionToggles() {
    this.el.querySelectorAll('.sp-section-header').forEach((header) => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling
        const arrow = header.querySelector('.arrow')
        const isHidden = content.classList.toggle('hidden')
        arrow.classList.toggle('open', !isHidden)
      })
    })
  }

  _bindModel() {
    const fileInput = this.el.querySelector('#sp-file-input')
    const modelName = this.el.querySelector('#sp-model-name')
    const dropZone = this.el.querySelector('#drop-zone')

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        modelName.textContent = file.name
        this.modelLoader.loadFile(file)
        this.modelLoader.onLoad = (scene) => {
          this.materials.setModel(scene)
          this._refreshMatSelect()
        }
      }
    })

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.style.borderColor = '#333'
      dropZone.style.background = 'rgba(0,0,0,0.04)'
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'rgba(0,0,0,0.15)'
      dropZone.style.background = 'transparent'
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.style.borderColor = 'rgba(0,0,0,0.15)'
      dropZone.style.background = 'transparent'
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        modelName.textContent = file.name
        this.modelLoader.loadFile(file)
        this.modelLoader.onLoad = (scene) => {
          this.materials.setModel(scene)
          this._refreshMatSelect()
        }
      }
    })

    document.addEventListener('dragover', (e) => {
      e.preventDefault()
    })

    document.addEventListener('drop', (e) => {
      e.preventDefault()
    })
  }

  _bindScene() {
    const bgColor = this.el.querySelector('#sp-bg-color')
    bgColor.addEventListener('input', () => this.environment.setBackground(bgColor.value))

    const groundToggle = this.el.querySelector('#sp-ground-toggle')
    groundToggle.addEventListener('click', () => {
      groundToggle.classList.toggle('active')
      this.environment.setGroundVisible(groundToggle.classList.contains('active'))
    })

    const groundColor = this.el.querySelector('#sp-ground-color')
    groundColor.addEventListener('input', () => {
      this.environment.setGroundColor(parseInt(groundColor.value.slice(1), 16))
    })

    const gridToggle = this.el.querySelector('#sp-grid-toggle')
    gridToggle.addEventListener('click', () => {
      gridToggle.classList.toggle('active')
      this.environment.toggleGrid(gridToggle.classList.contains('active'))
    })

    const shadowsToggle = this.el.querySelector('#sp-shadows-toggle')
    shadowsToggle.addEventListener('click', () => {
      shadowsToggle.classList.toggle('active')
      this.environment.toggleShadows(shadowsToggle.classList.contains('active'))
    })
  }

  _bindLighting() {
    const lightDefs = [
      { id: 'ambient', colorDefault: '#ffffff', intDefault: 0.4, pos: false },
      { id: 'hemi', colorDefault: '#87ceeb', intDefault: 0.8, pos: false },
      { id: 'hemi-gnd', colorDefault: '#362d24', intDefault: 0.8, pos: false },
      { id: 'key', colorDefault: '#ffffff', intDefault: 2.5, pos: true, posDefault: { x: 5, y: 8, z: 5 } },
      { id: 'fill', colorDefault: '#4488ff', intDefault: 0.8, pos: true, posDefault: { x: -4, y: 2, z: -3 } },
      { id: 'rim', colorDefault: '#ff8844', intDefault: 0.6, pos: true, posDefault: { x: -2, y: 1, z: -5 } },
    ]

    lightDefs.forEach((def) => {
      const intSlider = this.el.querySelector(`#sp-light-${def.id}-int`)
      const colorPicker = this.el.querySelector(`#sp-light-${def.id}-color`)

      if (intSlider) {
        intSlider.value = def.intDefault
        intSlider.addEventListener('input', () => {
          const lightId = def.id === 'hemi-gnd' ? 'hemi' : def.id
          this.lighting.setIntensity(lightId, parseFloat(intSlider.value))
        })
      }

      if (colorPicker) {
        colorPicker.value = def.colorDefault
        colorPicker.addEventListener('input', () => {
          if (def.id === 'hemi-gnd') {
            this.lighting.lights.hemi.groundColor.setHex(parseInt(colorPicker.value.slice(1), 16))
          } else {
            this.lighting.setColor(def.id, parseInt(colorPicker.value.slice(1), 16))
          }
        })
      }

      if (def.pos) {
        const px = this.el.querySelector(`#sp-light-${def.id}-posx`)
        const py = this.el.querySelector(`#sp-light-${def.id}-posy`)
        const pz = this.el.querySelector(`#sp-light-${def.id}-posz`)
        if (px) px.value = def.posDefault.x
        if (py) py.value = def.posDefault.y
        if (pz) pz.value = def.posDefault.z
        const updatePos = () => {
          this.lighting.setPosition(def.id, parseFloat(px.value), parseFloat(py.value), parseFloat(pz.value))
        }
        if (px) px.addEventListener('input', updatePos)
        if (py) py.addEventListener('input', updatePos)
        if (pz) pz.addEventListener('input', updatePos)
      }
    })
  }

  _bindEnvironment() {
    const presetSelect = this.el.querySelector('#sp-env-preset')
    presetSelect.addEventListener('change', () => {
      this.environment.setEnvPreset(presetSelect.value)
    })

    const envInt = this.el.querySelector('#sp-env-intensity')
    envInt.addEventListener('input', () => {
      this.environment.setEnvIntensity(parseFloat(envInt.value))
    })
  }

  _bindMaterials() {
    const toggle = this.el.querySelector('#sp-mat-toggle')
    const rough = this.el.querySelector('#sp-mat-roughness')
    const metal = this.el.querySelector('#sp-mat-metalness')
    const envInt = this.el.querySelector('#sp-mat-envint')
    const color = this.el.querySelector('#sp-mat-color')
    const matSelect = this.el.querySelector('#sp-mat-select')
    const perMatControls = this.el.querySelector('#sp-permat-controls')
    const perRough = this.el.querySelector('#sp-permat-roughness')
    const perMetal = this.el.querySelector('#sp-permat-metalness')
    const perColor = this.el.querySelector('#sp-permat-color')

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active')
      this.materials.setEnabled(toggle.classList.contains('active'))
    })

    rough.addEventListener('input', () => this.materials.setGlobalRoughness(parseFloat(rough.value)))
    metal.addEventListener('input', () => this.materials.setGlobalMetalness(parseFloat(metal.value)))
    envInt.addEventListener('input', () => this.materials.setGlobalEnvIntensity(parseFloat(envInt.value)))
    color.addEventListener('input', () => this.materials.setGlobalColor(parseInt(color.value.slice(1), 16)))

    matSelect.addEventListener('change', () => {
      if (matSelect.value) {
        perMatControls.style.display = 'block'
      } else {
        perMatControls.style.display = 'none'
      }
    })

    perRough.addEventListener('input', () => {
      if (matSelect.value) this.materials.setPerMaterialOverride(matSelect.value, 'roughness', parseFloat(perRough.value))
    })
    perMetal.addEventListener('input', () => {
      if (matSelect.value) this.materials.setPerMaterialOverride(matSelect.value, 'metalness', parseFloat(perMetal.value))
    })
    perColor.addEventListener('input', () => {
      if (matSelect.value) this.materials.setPerMaterialOverride(matSelect.value, 'color', parseInt(perColor.value.slice(1), 16))
    })
  }

  _bindCamera() {
    const nameInput = this.el.querySelector('#sp-preset-name')
    const saveBtn = this.el.querySelector('#sp-save-preset')
    const selectEl = this.el.querySelector('#sp-preset-select')
    const delBtn = this.el.querySelector('#sp-del-preset')
    const exportBtn = this.el.querySelector('#sp-export-all')
    const dataEl = this.el.querySelector('#sp-cam-data')

    const refreshSelect = () => {
      selectEl.innerHTML = '<option value="">— presets —</option>'
      this.presets.getNames().forEach((name) => {
        const opt = document.createElement('option')
        opt.value = name
        opt.textContent = name
        selectEl.appendChild(opt)
      })
    }

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim()
      if (!name) return
      this.presets.save(name)
      nameInput.value = ''
      refreshSelect()
    })

    selectEl.addEventListener('change', () => {
      const name = selectEl.value
      if (!name) return
      this.presets.load(name)
    })

    delBtn.addEventListener('click', () => {
      const name = selectEl.value
      if (!name) return
      this.presets.delete(name)
      selectEl.value = ''
      refreshSelect()
    })

    exportBtn.addEventListener('click', () => {
      const json = this.presets.exportJSON()
      navigator.clipboard.writeText(json).catch(() => {})
      const orig = exportBtn.textContent
      exportBtn.textContent = 'Copied!'
      setTimeout(() => { exportBtn.textContent = orig }, 2000)
    })

    this._camRefresh = () => {
      const p = this.presets
      const pos = p.camera.position
      const tgt = p.controls.target
      dataEl.textContent =
        `pos: ${pos.x.toFixed(4)}, ${pos.y.toFixed(4)}, ${pos.z.toFixed(4)}\n` +
        `tgt: ${tgt.x.toFixed(4)}, ${tgt.y.toFixed(4)}, ${tgt.z.toFixed(4)}\n` +
        `fov: ${p.camera.fov.toFixed(1)}°\n` +
        `dist: ${pos.distanceTo(tgt).toFixed(4)}`
    }

    refreshSelect()
  }

  _bindReset() {
    const btn = this.el.querySelector('#sp-reset-btn')
    btn.addEventListener('click', () => {
      const d = this.defaults

      this.modelLoader.clear()

      this.presets.camera.position.set(d.camera.pos[0], d.camera.pos[1], d.camera.pos[2])
      this.presets.camera.fov = d.camera.fov
      this.presets.camera.updateProjectionMatrix()
      this.presets.controls.target.set(d.camera.target[0], d.camera.target[1], d.camera.target[2])
      this.presets.controls.update()

      this.environment.setBackground(d.bg)
      this.environment.setGroundVisible(d.ground.visible)
      this.environment.setGroundColor(parseInt(d.ground.color.slice(1), 16))
      this.environment.toggleGrid(d.grid)
      this.environment.toggleShadows(d.shadows)
      this.environment.setEnvPreset(d.env.preset)
      this.environment.setEnvIntensity(d.env.intensity)

      Object.entries(d.lights).forEach(([id, cfg]) => {
        const lightId = id === 'hemi-gnd' ? 'hemi' : id
        this.lighting.setIntensity(lightId, cfg.int)
        if (cfg.color) {
          if (id === 'hemi-gnd') {
            this.lighting.lights.hemi.groundColor.setHex(parseInt(cfg.color.slice(1), 16))
          } else {
            this.lighting.setColor(lightId, parseInt(cfg.color.slice(1), 16))
          }
        }
        if (cfg.pos) {
          this.lighting.setPosition(lightId, cfg.pos.x, cfg.pos.y, cfg.pos.z)
        }
      })

      this.materials.setModel(null)
      this.materials.setEnabled(d.mat.enabled)
      this.materials.setGlobalRoughness(d.mat.roughness)
      this.materials.setGlobalMetalness(d.mat.metalness)
      this.materials.setGlobalEnvIntensity(d.mat.envInt)
      this.materials.setGlobalColor(parseInt(d.mat.color.slice(1), 16))

      this.el.querySelector('#sp-bg-color').value = d.bg
      this.el.querySelector('#sp-ground-toggle').classList.toggle('active', d.ground.visible)
      this.el.querySelector('#sp-ground-color').value = d.ground.color
      this.el.querySelector('#sp-grid-toggle').classList.remove('active')
      this.el.querySelector('#sp-shadows-toggle').classList.add('active')
      this.el.querySelector('#sp-env-preset').value = d.env.preset
      this.el.querySelector('#sp-env-intensity').value = d.env.intensity
      this.el.querySelector('#sp-mat-toggle').classList.remove('active')
      this.el.querySelector('#sp-mat-roughness').value = d.mat.roughness
      this.el.querySelector('#sp-mat-metalness').value = d.mat.metalness
      this.el.querySelector('#sp-mat-envint').value = d.mat.envInt
      this.el.querySelector('#sp-mat-color').value = d.mat.color
      this.el.querySelector('#sp-mat-select').value = ''
      this.el.querySelector('#sp-permat-controls').style.display = 'none'
      this.el.querySelector('#sp-model-name').textContent = ''

      const lightDefs = [
        { id: 'ambient', int: 0.4, color: '#ffffff' },
        { id: 'hemi', int: 0.8, color: '#87ceeb' },
        { id: 'hemi-gnd', int: 0.8, color: '#362d24' },
        { id: 'key', int: 2.5, color: '#ffffff', pos: { x: 5, y: 8, z: 5 } },
        { id: 'fill', int: 0.8, color: '#4488ff', pos: { x: -4, y: 2, z: -3 } },
        { id: 'rim', int: 0.6, color: '#ff8844', pos: { x: -2, y: 1, z: -5 } },
      ]
      lightDefs.forEach((def) => {
        const intSlider = this.el.querySelector(`#sp-light-${def.id}-int`)
        if (intSlider) intSlider.value = def.int
        const colorPicker = this.el.querySelector(`#sp-light-${def.id}-color`)
        if (colorPicker) colorPicker.value = def.color
        if (def.pos) {
          const px = this.el.querySelector(`#sp-light-${def.id}-posx`)
          const py = this.el.querySelector(`#sp-light-${def.id}-posy`)
          const pz = this.el.querySelector(`#sp-light-${def.id}-posz`)
          if (px) px.value = def.pos.x
          if (py) py.value = def.pos.y
          if (pz) pz.value = def.pos.z
        }
      })

      this._refreshMatSelect()
    })
  }

  _refreshMatSelect() {
    const select = this.el.querySelector('#sp-mat-select')
    select.innerHTML = '<option value="">— none —</option>'
    this.materials.getMaterialNames().forEach((name) => {
      const opt = document.createElement('option')
      opt.value = name
      opt.textContent = name
      select.appendChild(opt)
    })
  }

  _setupDrag() {
    const header = this.el.querySelector('#sp-header')
    let dragging = false, startX, startY, origX, origY

    header.addEventListener('mousedown', (e) => {
      dragging = true
      startX = e.clientX
      startY = e.clientY
      origX = this.el.offsetLeft
      origY = this.el.offsetTop
      this.el.style.cursor = 'grabbing'
      e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return
      this.el.style.left = `${origX + e.clientX - startX}px`
      this.el.style.top = `${origY + e.clientY - startY}px`
      this.el.style.right = 'auto'
    })

    document.addEventListener('mouseup', () => {
      if (!dragging) return
      dragging = false
      this.el.style.cursor = 'grab'
    })
  }

  update() {
    if (this.visible && this._camRefresh) {
      this._camRefresh()
    }
  }
}
