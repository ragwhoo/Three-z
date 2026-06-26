const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.PROD === true

const STORAGE_KEY = 'camera-debugger-presets'
const SIX = { minimumFractionDigits: 6, maximumFractionDigits: 6 }

function fmt(v) {
  return Number(v).toLocaleString('en-US', SIX)
}

function copy(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export class CameraDebugger {
  constructor({ camera, controls, renderer }) {
    if (isProduction) return

    this.camera = camera
    this.controls = controls
    this.renderer = renderer
    this.visible = false
    this.collapsed = false
    this.scrollAnimationsEnabled = false

    this.buildPanel()
    this.bindKeys()
    this.startLoop()
  }

  buildPanel() {
    this.el = document.createElement('div')
    this.el.id = 'cd-panel'
    this.el.innerHTML = `
      <div id="cd-header">
        <span id="cd-title">Camera Debugger</span>
        <span id="cd-collapse-btn">−</span>
      </div>
      <div id="cd-body">
        <div class="cd-row"><span class="cd-label">FOV</span><span class="cd-val" id="cd-fov"></span></div>
        <div class="cd-sep"></div>
        <div class="cd-sub">Position</div>
        <div class="cd-row"><span class="cd-label">x</span><span class="cd-val mon" id="cd-pos-x"></span></div>
        <div class="cd-row"><span class="cd-label">y</span><span class="cd-val mon" id="cd-pos-y"></span></div>
        <div class="cd-row"><span class="cd-label">z</span><span class="cd-val mon" id="cd-pos-z"></span></div>
        <div class="cd-sep"></div>
        <div class="cd-sub">Rotation (Euler)</div>
        <div class="cd-row"><span class="cd-label">x</span><span class="cd-val mon" id="cd-eul-x"></span></div>
        <div class="cd-row"><span class="cd-label">y</span><span class="cd-val mon" id="cd-eul-y"></span></div>
        <div class="cd-row"><span class="cd-label">z</span><span class="cd-val mon" id="cd-eul-z"></span></div>
        <div class="cd-sep"></div>
        <div class="cd-sub">Quaternion</div>
        <div class="cd-row"><span class="cd-label">x</span><span class="cd-val mon" id="cd-quat-x"></span></div>
        <div class="cd-row"><span class="cd-label">y</span><span class="cd-val mon" id="cd-quat-y"></span></div>
        <div class="cd-row"><span class="cd-label">z</span><span class="cd-val mon" id="cd-quat-z"></span></div>
        <div class="cd-row"><span class="cd-label">w</span><span class="cd-val mon" id="cd-quat-w"></span></div>
        <div class="cd-sep"></div>
        <div class="cd-sub">Controls Target</div>
        <div class="cd-row"><span class="cd-label">x</span><span class="cd-val mon" id="cd-tgt-x"></span></div>
        <div class="cd-row"><span class="cd-label">y</span><span class="cd-val mon" id="cd-tgt-y"></span></div>
        <div class="cd-row"><span class="cd-label">z</span><span class="cd-val mon" id="cd-tgt-z"></span></div>
        <div class="cd-sep"></div>
        <div class="cd-row"><span class="cd-label">Distance</span><span class="cd-val mon" id="cd-dist"></span></div>
        <div class="cd-sep"></div>
        <div class="cd-btn-row">
          <button class="cd-btn" data-copy="pos">Copy Position</button>
          <button class="cd-btn" data-copy="tgt">Copy Target</button>
        </div>
        <div class="cd-btn-row">
          <button class="cd-btn" data-copy="state">Copy Full State</button>
          <button class="cd-btn" data-copy="json">Copy JSON</button>
        </div>
        <div class="cd-sep"></div>
        <div class="cd-preset-row">
          <input id="cd-preset-name" placeholder="Preset name..." />
          <button class="cd-btn sm" id="cd-save-preset">Save</button>
        </div>
        <div class="cd-preset-row">
          <select id="cd-preset-select"><option value="">— Saved presets —</option></select>
          <button class="cd-btn sm danger" id="cd-del-preset">Delete</button>
        </div>
      </div>`

    Object.assign(this.el.style, {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: '99999',
      width: '300px',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: '12px',
      color: '#e0e0e0',
      background: 'rgba(10,10,15,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
      userSelect: 'none',
      cursor: 'grab',
      display: 'none',
      overflow: 'hidden',
    })

    const style = document.createElement('style')
    style.textContent = `
      #cd-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; cursor:grab; border-bottom:1px solid rgba(255,255,255,0.06); }
      #cd-title { font-weight:600; font-size:13px; letter-spacing:-0.01em; color:#fff; }
      #cd-collapse-btn { cursor:pointer; font-size:16px; line-height:1; color:rgba(255,255,255,0.35); padding:0 2px; }
      #cd-collapse-btn:hover { color:#e74c3c; }
      #cd-body { padding:10px 14px 14px; }
      .cd-sub { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.25); margin:6px 0 4px; }
      .cd-row { display:flex; justify-content:space-between; align-items:center; padding:2px 0; }
      .cd-label { color:rgba(255,255,255,0.3); font-size:11px; min-width:20px; }
      .cd-val { color:rgba(255,255,255,0.75); font-size:11px; text-align:right; }
      .cd-val.mon { font-family:'JetBrains Mono','Consolas',monospace; font-size:11px; }
      .cd-sep { height:1px; background:rgba(255,255,255,0.04); margin:5px 0; }
      .cd-btn-row { display:flex; gap:4px; margin-top:4px; }
      .cd-btn { flex:1; padding:5px 8px; font-size:10px; font-weight:500; font-family:inherit; color:#ccc; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:5px; cursor:pointer; transition:all 0.15s; }
      .cd-btn:hover { background:rgba(255,255,255,0.12); color:#fff; }
      .cd-btn.sm { flex:0 0 auto; padding:5px 10px; }
      .cd-btn.danger { color:#e74c3c; border-color:rgba(231,76,60,0.25); }
      .cd-btn.danger:hover { background:rgba(231,76,60,0.15); }
      .cd-preset-row { display:flex; gap:4px; margin-top:4px; }
      .cd-preset-row input { flex:1; padding:5px 8px; font-size:11px; font-family:inherit; color:#ccc; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:5px; outline:none; }
      .cd-preset-row input:focus { border-color:rgba(231,76,60,0.4); }
      .cd-preset-row select { flex:1; padding:5px 8px; font-size:11px; font-family:inherit; color:#ccc; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:5px; outline:none; cursor:pointer; }
      .cd-preset-row select:focus { border-color:rgba(231,76,60,0.4); }
    `
    document.head.appendChild(style)
    document.body.appendChild(this.el)

    this.bodyEl = this.el.querySelector('#cd-body')
    this.collapseBtn = this.el.querySelector('#cd-collapse-btn')

    this.collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.collapsed = !this.collapsed
      this.bodyEl.style.display = this.collapsed ? 'none' : 'block'
      this.collapseBtn.textContent = this.collapsed ? '+' : '−'
    })

    this.bindCopyButtons()
    this.bindPresetButtons()
    this.bindDrag()

    this.fovEl = this.el.querySelector('#cd-fov')
    this.posX = this.el.querySelector('#cd-pos-x')
    this.posY = this.el.querySelector('#cd-pos-y')
    this.posZ = this.el.querySelector('#cd-pos-z')
    this.eulX = this.el.querySelector('#cd-eul-x')
    this.eulY = this.el.querySelector('#cd-eul-y')
    this.eulZ = this.el.querySelector('#cd-eul-z')
    this.quatX = this.el.querySelector('#cd-quat-x')
    this.quatY = this.el.querySelector('#cd-quat-y')
    this.quatZ = this.el.querySelector('#cd-quat-z')
    this.quatW = this.el.querySelector('#cd-quat-w')
    this.tgtX = this.el.querySelector('#cd-tgt-x')
    this.tgtY = this.el.querySelector('#cd-tgt-y')
    this.tgtZ = this.el.querySelector('#cd-tgt-z')
    this.distEl = this.el.querySelector('#cd-dist')
  }

  bindCopyButtons() {
    this.el.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.copy
        const { position, rotation, quaternion } = this.camera
        const target = this.controls?.target || { x: 0, y: 0, z: 0 }

        switch (type) {
          case 'pos':
            copy(`camera.position.set(${fmt(position.x)}, ${fmt(position.y)}, ${fmt(position.z)});`)
            break
          case 'tgt':
            copy(`controls.target.set(${fmt(target.x)}, ${fmt(target.y)}, ${fmt(target.z)});\ncontrols.update();`)
            break
          case 'state':
            copy([
              `camera.position.set(${fmt(position.x)}, ${fmt(position.y)}, ${fmt(position.z)});`,
              `camera.rotation.set(${fmt(rotation.x)}, ${fmt(rotation.y)}, ${fmt(rotation.z)});`,
              `camera.fov = ${fmt(this.camera.fov)};`,
              `camera.updateProjectionMatrix();`,
              ``,
              `controls.target.set(${fmt(target.x)}, ${fmt(target.y)}, ${fmt(target.z)});`,
              `controls.update();`,
            ].join('\n'))
            break
          case 'json':
            copy(JSON.stringify({
              position: [+fmt(position.x), +fmt(position.y), +fmt(position.z)],
              rotation: [+fmt(rotation.x), +fmt(rotation.y), +fmt(rotation.z)],
              quaternion: [+fmt(quaternion.x), +fmt(quaternion.y), +fmt(quaternion.z), +fmt(quaternion.w)],
              target: [+fmt(target.x), +fmt(target.y), +fmt(target.z)],
              fov: +fmt(this.camera.fov),
            }, null, 2))
            break
        }
      })
    })
  }

  bindPresetButtons() {
    this.saveBtn = this.el.querySelector('#cd-save-preset')
    this.nameInput = this.el.querySelector('#cd-preset-name')
    this.selectEl = this.el.querySelector('#cd-preset-select')
    this.delBtn = this.el.querySelector('#cd-del-preset')

    this.loadPresets()

    this.saveBtn.addEventListener('click', () => {
      const name = this.nameInput.value.trim()
      if (!name) return
      const presets = this.getPresets()
      const { position, rotation, quaternion } = this.camera
      const target = this.controls?.target || { x: 0, y: 0, z: 0 }
      presets[name] = {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
        target: { x: target.x, y: target.y, z: target.z },
        fov: this.camera.fov,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
      this.nameInput.value = ''
      this.loadPresets(name)
    })

    this.selectEl.addEventListener('change', () => {
      const name = this.selectEl.value
      if (!name) return
      const presets = this.getPresets()
      const p = presets[name]
      if (!p) return
      this.camera.position.set(p.position.x, p.position.y, p.position.z)
      this.camera.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z)
      this.camera.fov = p.fov
      this.camera.updateProjectionMatrix()
      if (this.controls) {
        this.controls.target.set(p.target.x, p.target.y, p.target.z)
        this.controls.update()
      }
      this.selectEl.value = ''
    })

    this.delBtn.addEventListener('click', () => {
      const name = this.selectEl.value
      if (!name) return
      const presets = this.getPresets()
      delete presets[name]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
      this.selectEl.value = ''
      this.loadPresets()
    })
  }

  getPresets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  loadPresets(selectName) {
    const presets = this.getPresets()
    this.selectEl.innerHTML = '<option value="">— Saved presets —</option>'
    Object.keys(presets).forEach((name) => {
      const opt = document.createElement('option')
      opt.value = name
      opt.textContent = name
      this.selectEl.appendChild(opt)
    })
    if (selectName) this.selectEl.value = selectName
  }

  bindDrag() {
    const header = this.el.querySelector('#cd-header')
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

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        this.visible = !this.visible
        this.el.style.display = this.visible ? 'block' : 'none'
      }
      if (e.key === 'p' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        this.logState()
      }
      if (e.key === 'P' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        this.copyState()
      }
    })
  }

  logState() {
    const { position, rotation, quaternion } = this.camera
    const target = this.controls?.target || { x: 0, y: 0, z: 0 }
    const dist = position.distanceTo(target)
    console.log('%c[CameraDebugger]', 'color:#e74c3c;font-weight:700', {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
      target: [target.x, target.y, target.z],
      fov: this.camera.fov,
      distance: dist,
    })
  }

  copyState() {
    const { position, rotation, quaternion } = this.camera
    const target = this.controls?.target || { x: 0, y: 0, z: 0 }
    copy([
      `camera.position.set(${fmt(position.x)}, ${fmt(position.y)}, ${fmt(position.z)});`,
      `camera.rotation.set(${fmt(rotation.x)}, ${fmt(rotation.y)}, ${fmt(rotation.z)});`,
      `camera.fov = ${fmt(this.camera.fov)};`,
      `camera.updateProjectionMatrix();`,
      ``,
      `controls.target.set(${fmt(target.x)}, ${fmt(target.y)}, ${fmt(target.z)});`,
      `controls.update();`,
    ].join('\n'))
  }

  startLoop() {
    if (isProduction) return
    const tick = () => {
      if (this.visible) this.update()
      this.raf = requestAnimationFrame(tick)
    }
    tick()
  }

  update() {
    const { position, rotation, quaternion } = this.camera
    const target = this.controls?.target || { x: 0, y: 0, z: 0 }

    this.fovEl.textContent = fmt(this.camera.fov) + '°'

    this.posX.textContent = fmt(position.x)
    this.posY.textContent = fmt(position.y)
    this.posZ.textContent = fmt(position.z)

    this.eulX.textContent = fmt(rotation.x)
    this.eulY.textContent = fmt(rotation.y)
    this.eulZ.textContent = fmt(rotation.z)

    this.quatX.textContent = fmt(quaternion.x)
    this.quatY.textContent = fmt(quaternion.y)
    this.quatZ.textContent = fmt(quaternion.z)
    this.quatW.textContent = fmt(quaternion.w)

    this.tgtX.textContent = fmt(target.x)
    this.tgtY.textContent = fmt(target.y)
    this.tgtZ.textContent = fmt(target.z)

    this.distEl.textContent = fmt(position.distanceTo(target))
  }

  dispose() {
    if (this.raf) cancelAnimationFrame(this.raf)
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el)
  }
}
