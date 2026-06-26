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
      ground: { visible: true, color: '#f5f5f5', y: -2 },
      grid: false,
      shadows: true,
      env: { preset: 'studio', intensity: 1 },
      mat: { enabled: false, roughness: 0.4, metalness: 0.3, envInt: 1, color: '#cccccc' },
    }
    this.lightEntries = {}

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
          <div class="sp-btn-row">
            <button class="sp-btn" id="sp-save-btn" style="flex:1">Save Project</button>
            <button class="sp-btn" id="sp-load-btn" style="flex:1">Load Project</button>
          </div>
          <div style="margin-top:4px">
            <button class="sp-btn primary" id="sp-export-scene" style="width:100%">Export Scene Config</button>
          </div>
          <div style="margin-top:4px">
            <button class="sp-btn danger" id="sp-reset-btn" style="width:100%">Reset All to Defaults</button>
          </div>
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
          <div class="sp-row">
            <span class="sp-label">Ground Y</span>
            <input type="range" min="-5" max="5" step="0.01" value="-2" id="sp-ground-y" style="width:80px" />
          </div>
        </div>
      </div>`
  }

  _lightingSection() {
    return `
      <div class="sp-section" data-section="lighting">
        <div class="sp-section-header">
          Lighting
          <span class="arrow open">▸</span>
        </div>
        <div class="sp-section-content" id="sp-sec-lighting">
          <div class="sp-row">
            <select id="sp-add-light-type" style="flex:1">
              <option value="ambient">Ambient</option>
              <option value="directional">Directional</option>
              <option value="point">Point</option>
              <option value="spot">Spot</option>
              <option value="hemisphere">Hemisphere</option>
            </select>
            <button class="sp-btn sm" id="sp-add-light-btn">+ Add</button>
          </div>
          <div id="sp-lighting-list"></div>
        </div>
      </div>`
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
            <span style="display:flex;align-items:center;gap:4px;position:relative">
              <div id="sp-mat-picker" style="display:none;position:absolute;top:100%;right:0;z-index:10;background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:6px;padding:4px;max-height:180px;overflow-y:auto;width:180px;box-shadow:0 8px 24px rgba(0,0,0,0.12)"></div>
              <button class="sp-btn sm" id="sp-mat-picker-btn" style="min-width:80px;text-align:left">Select...</button>
            </span>
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
    this._bindProjectSaveLoad()
    this._bindExportScene()

    this._autoRestore()
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

    const groundY = this.el.querySelector('#sp-ground-y')
    groundY.addEventListener('input', () => {
      this.environment.setGroundHeight(parseFloat(groundY.value))
    })
  }

  _bindLighting() {
    const list = this.el.querySelector('#sp-lighting-list')
    const addBtn = this.el.querySelector('#sp-add-light-btn')
    const typeSelect = this.el.querySelector('#sp-add-light-type')

    this._createLightUI = (id, type, config) => {
      const entry = document.createElement('div')
      entry.className = 'sp-lgt-entry'
      entry.style.cssText = 'border:1px solid rgba(0,0,0,0.06);border-radius:6px;padding:6px;margin-top:6px;'

      const hasPos = type === 'directional' || type === 'point' || type === 'spot'
      const hasGround = type === 'hemisphere'
      const defaultPos = config?.pos ? config.pos : { x: 0, y: type === 'directional' ? 5 : 3, z: 0 }

      entry.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:10px;font-weight:600;text-transform:uppercase;color:rgba(0,0,0,0.4)">${type}</span>
          <button class="sp-btn sm sp-lgt-remove" data-id="${id}" style="color:#e74c3c;border-color:rgba(231,76,60,0.2);padding:2px 6px;font-size:9px">✕</button>
        </div>
        <div class="sp-row">
          <span class="sp-label" style="min-width:40px">Intensity</span>
          <input type="range" min="0" max="5" step="0.01" value="${config?.intensity ?? 1}" data-id="${id}" data-prop="int" style="width:60px" />
          <input type="color" value="${config?.color ? '#' + config.color.toString(16).padStart(6, '0') : '#ffffff'}" data-id="${id}" data-prop="color" style="width:18px;height:18px" />
        </div>
        ${hasPos ? `
        <div class="sp-row" style="padding-left:44px">
          <input type="range" min="-10" max="10" step="0.1" value="${defaultPos.x}" data-id="${id}" data-prop="posx" style="width:26px" />
          <input type="range" min="-10" max="10" step="0.1" value="${defaultPos.y}" data-id="${id}" data-prop="posy" style="width:26px" />
          <input type="range" min="-10" max="10" step="0.1" value="${defaultPos.z}" data-id="${id}" data-prop="posz" style="width:26px" />
        </div>` : ''}
        ${hasGround ? `
        <div class="sp-row">
          <span class="sp-label" style="min-width:40px">Ground</span>
          <input type="color" value="#362d24" data-id="${id}" data-prop="groundColor" style="width:18px;height:18px" />
        </div>` : ''}
      `

      entry.querySelectorAll('input[type="range"], input[type="color"]').forEach((input) => {
        input.addEventListener('input', () => {
          const prop = input.dataset.prop
          const val = input.type === 'color' ? parseInt(input.value.slice(1), 16) : parseFloat(input.value)
          switch (prop) {
            case 'int': this.lighting.updateIntensity(id, val); break
            case 'color': this.lighting.updateColor(id, val); break
            case 'groundColor': this.lighting.updateGroundColor(val); break
            case 'posx': this.lighting.updatePosition(id, val, parseFloat(entry.querySelector('[data-prop="posy"]').value), parseFloat(entry.querySelector('[data-prop="posz"]').value)); break
            case 'posy': this.lighting.updatePosition(id, parseFloat(entry.querySelector('[data-prop="posx"]').value), val, parseFloat(entry.querySelector('[data-prop="posz"]').value)); break
            case 'posz': this.lighting.updatePosition(id, parseFloat(entry.querySelector('[data-prop="posx"]').value), parseFloat(entry.querySelector('[data-prop="posy"]').value), val); break
          }
        })
      })

      entry.querySelector('.sp-lgt-remove').addEventListener('click', () => {
        this.lighting.removeLight(id)
        entry.remove()
      })

      list.appendChild(entry)
      this.lightEntries[id] = entry
    }

    addBtn.addEventListener('click', () => {
      const id = this.lighting.addLight(typeSelect.value)
      if (id) this._createLightUI(id, typeSelect.value, { intensity: 1, color: 0xffffff })
    })

    this.lighting.getAll().forEach(({ id, type, light }) => {
      const config = {
        intensity: light.intensity,
        color: light.color.getHex(),
        pos: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
      }
      this._createLightUI(id, type, config)
    })

    this.lighting.onPositionChange = (id, x, y, z) => {
      const entry = this.lightEntries[id]
      if (!entry) return
      const px = entry.querySelector('[data-prop="posx"]')
      const py = entry.querySelector('[data-prop="posy"]')
      const pz = entry.querySelector('[data-prop="posz"]')
      if (px) px.value = x
      if (py) py.value = y
      if (pz) pz.value = z
    }
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
    const perMatControls = this.el.querySelector('#sp-permat-controls')
    const perRough = this.el.querySelector('#sp-permat-roughness')
    const perMetal = this.el.querySelector('#sp-permat-metalness')
    const perColor = this.el.querySelector('#sp-permat-color')
    const pickerBtn = this.el.querySelector('#sp-mat-picker-btn')
    const picker = this.el.querySelector('#sp-mat-picker')

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active')
      this.materials.setEnabled(toggle.classList.contains('active'))
    })

    rough.addEventListener('input', () => this.materials.setGlobalRoughness(parseFloat(rough.value)))
    metal.addEventListener('input', () => this.materials.setGlobalMetalness(parseFloat(metal.value)))
    envInt.addEventListener('input', () => this.materials.setGlobalEnvIntensity(parseFloat(envInt.value)))
    color.addEventListener('input', () => this.materials.setGlobalColor(parseInt(color.value.slice(1), 16)))

    let selectedMat = null

    const selectMat = (name) => {
      selectedMat = name
      if (name) {
        perMatControls.style.display = 'block'
        pickerBtn.textContent = name.length > 18 ? name.slice(0, 16) + '…' : name
        const props = this.materials.getMaterialsMap()[name]
        if (props) {
          perRough.value = props.roughness ?? 0.5
          perMetal.value = props.metalness ?? 0.5
          const hex = '#' + (props.color ?? 0xcccccc).toString(16).padStart(6, '0')
          perColor.value = hex
        }
      } else {
        perMatControls.style.display = 'none'
        pickerBtn.textContent = 'Select...'
      }
      picker.style.display = 'none'
    }

    pickerBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      picker.style.display = picker.style.display === 'block' ? 'none' : 'block'
      this._refreshMatPicker()
    })

    document.addEventListener('click', () => { picker.style.display = 'none' })

    perRough.addEventListener('input', () => {
      if (selectedMat) this.materials.setPerMaterialOverride(selectedMat, 'roughness', parseFloat(perRough.value))
    })
    perMetal.addEventListener('input', () => {
      if (selectedMat) this.materials.setPerMaterialOverride(selectedMat, 'metalness', parseFloat(perMetal.value))
    })
    perColor.addEventListener('input', () => {
      if (selectedMat) this.materials.setPerMaterialOverride(selectedMat, 'color', parseInt(perColor.value.slice(1), 16))
    })

    this._selectMaterial = selectMat
  }

  _refreshMatPicker() {
    const picker = this.el.querySelector('#sp-mat-picker')
    const names = this.materials.getMaterialNames()
    const props = this.materials.getMaterialsMap()
    picker.innerHTML = ''
    if (names.length === 0) {
      picker.innerHTML = '<div style="padding:8px;font-size:10px;color:#999">No materials</div>'
      return
    }
    names.forEach((name) => {
      const item = document.createElement('div')
      const p = props[name]
      const hex = p && p.color !== undefined
        ? '#' + p.color.toString(16).padStart(6, '0')
        : '#ccc'
      item.style.cssText =
        'display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:pointer;border-radius:4px;font-size:11px'
      item.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border-radius:3px;border:1px solid rgba(0,0,0,0.15);background:${hex};flex-shrink:0"></span><span>${name}</span>`
      item.addEventListener('mouseenter', () => { item.style.background = 'rgba(0,0,0,0.04)' })
      item.addEventListener('mouseleave', () => { item.style.background = '' })
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this._selectMaterial) this._selectMaterial(name)
      })
      picker.appendChild(item)
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
      this.environment.setGroundHeight(d.ground.y)
      this.environment.toggleGrid(d.grid)
      this.environment.toggleShadows(d.shadows)
      this.environment.setEnvPreset(d.env.preset)
      this.environment.setEnvIntensity(d.env.intensity)

      this.lighting.clearAll()
      this.el.querySelector('#sp-lighting-list').innerHTML = ''
      this.lightEntries = {}

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
      this.el.querySelector('#sp-ground-y').value = d.ground.y
      this.el.querySelector('#sp-env-preset').value = d.env.preset
      this.el.querySelector('#sp-env-intensity').value = d.env.intensity
      this.el.querySelector('#sp-mat-toggle').classList.remove('active')
      this.el.querySelector('#sp-mat-roughness').value = d.mat.roughness
      this.el.querySelector('#sp-mat-metalness').value = d.mat.metalness
      this.el.querySelector('#sp-mat-envint').value = d.mat.envInt
      this.el.querySelector('#sp-mat-color').value = d.mat.color
      this.el.querySelector('#sp-permat-controls').style.display = 'none'
      this.el.querySelector('#sp-model-name').textContent = ''
      this._refreshMatSelect()
    })
  }

  _bindProjectSaveLoad() {
    const saveBtn = this.el.querySelector('#sp-save-btn')
    const loadBtn = this.el.querySelector('#sp-load-btn')

    saveBtn.addEventListener('click', () => {
      const state = {
        lights: this.lighting.toJSON(),
        env: this.environment.toJSON(),
        materials: this.materials.toJSON(),
      }
      localStorage.setItem('model-viewer-project', JSON.stringify(state))
      const orig = saveBtn.textContent
      saveBtn.textContent = 'Saved!'
      setTimeout(() => { saveBtn.textContent = orig }, 2000)
    })

    loadBtn.addEventListener('click', () => {
      this._loadFromStorage()
      const orig = loadBtn.textContent
      loadBtn.textContent = 'Loaded!'
      setTimeout(() => { loadBtn.textContent = orig }, 2000)
    })
  }

  _bindExportScene() {
    const btn = this.el.querySelector('#sp-export-scene')
    btn.addEventListener('click', () => {
      let presets = {}
      try { presets = JSON.parse(localStorage.getItem('model-viewer-presets') || '{}') } catch {}

      const state = {
        lights: this.lighting.toJSON(),
        environment: this.environment.toJSON(),
        materials: this.materials.toJSON(),
        camera: {
          current: {
            position: [this.presets.camera.position.x, this.presets.camera.position.y, this.presets.camera.position.z],
            target: [this.presets.controls.target.x, this.presets.controls.target.y, this.presets.controls.target.z],
            fov: this.presets.camera.fov,
          },
          presets,
        },
        model: this.modelLoader.getTransform(),
      }

      const json = JSON.stringify(state, null, 2)
      navigator.clipboard.writeText(json).catch(() => {})
      const orig = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(() => { btn.textContent = orig }, 2000)
    })
  }

  _loadFromStorage() {
    const raw = localStorage.getItem('model-viewer-project')
    if (!raw) return
    try {
      const state = JSON.parse(raw)

      this.lighting.clearAll()
      this.lighting.fromJSON(state.lights || [])

      this.environment.fromJSON(state.env)

      this.materials.fromJSON(state.materials)

      this._restoreUI(state)
    } catch (e) {
      console.error('Failed to load project:', e)
    }
  }

  _restoreUI(state) {
    this.el.querySelector('#sp-lighting-list').innerHTML = ''
    this.lightEntries = {}
    this.lighting.getAll().forEach(({ id, type, light }) => {
      const config = {
        intensity: light.intensity,
        color: light.color.getHex(),
        pos: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : undefined,
      }
      this._createLightUI(id, type, config)
    })

    this._refreshMatSelect()

    const d = state?.env
    if (d) {
      this.el.querySelector('#sp-bg-color').value = d.background || '#f0f0f0'
      this.el.querySelector('#sp-ground-toggle').classList.toggle('active', d.groundVisible !== false)
      this.el.querySelector('#sp-ground-color').value = '#' + (d.groundColor ?? 0xf5f5f5).toString(16).padStart(6, '0')
      this.el.querySelector('#sp-ground-y').value = d.groundY ?? -2
      this.el.querySelector('#sp-grid-toggle').classList.toggle('active', !!d.gridVisible)
      this.el.querySelector('#sp-shadows-toggle').classList.toggle('active', d.shadowsEnabled !== false)
      this.el.querySelector('#sp-env-preset').value = d.envPreset || 'studio'
      this.el.querySelector('#sp-env-intensity').value = d.envIntensity ?? 1
    }

    const m = state?.materials
    if (m) {
      this.el.querySelector('#sp-mat-toggle').classList.toggle('active', !!m.enabled)
      if (m.globalOverrides) {
        this.el.querySelector('#sp-mat-roughness').value = m.globalOverrides.roughness ?? 0.4
        this.el.querySelector('#sp-mat-metalness').value = m.globalOverrides.metalness ?? 0.3
        this.el.querySelector('#sp-mat-envint').value = m.globalOverrides.envIntensity ?? 1
        if (m.globalOverrides.color !== null && m.globalOverrides.color !== undefined) {
          this.el.querySelector('#sp-mat-color').value = '#' + m.globalOverrides.color.toString(16).padStart(6, '0')
        }
      }
    }
  }

  _autoRestore() {
    this._loadFromStorage()
  }

  _refreshMatSelect() {
    const picker = this.el.querySelector('#sp-mat-picker')
    picker.innerHTML = ''
    if (this._selectMaterial) this._selectMaterial(null)
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
