export class CameraDebugger {
  constructor({ camera, controls, renderer }) {
    this.camera = camera
    this.controls = controls
    this.renderer = renderer
    this.visible = false
  }

  getData() {
    const { position, rotation, quaternion } = this.camera
    const target = this.controls?.target || { x: 0, y: 0, z: 0 }
    return {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
      target: [target.x, target.y, target.z],
      fov: this.camera.fov,
      distance: position.distanceTo(target),
    }
  }
}
