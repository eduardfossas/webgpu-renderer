import { mat4, vec3 } from "gl-matrix";

type Object3D = {
  x: number;
  y: number;
  z: number;
};

class Camera {
  public position: Object3D;
  public rotation: Object3D;
  public fovy: number = (2 * Math.PI) / 5;
  public aspect: number = 16 / 9;

  public near: number = 0.01;
  public far: number = 1000;

  public lookAt: vec3 = vec3.fromValues(0, 0, 0);

  public uniformBuffer: GPUBuffer;
  private matrixSize = 4 * 16;

  constructor(aspect: number) {
    this.aspect = aspect;
    this.createBuffer();
    this.position = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.rotation = {
      x: 0,
      y: 0,
      z: 0,
    };
  }

  private createBuffer() {
    this.uniformBuffer = gpu.device.createBuffer({
      size: this.matrixSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  public getViewMatrix(): mat4 {
    let viewMatrix = mat4.create();

    mat4.lookAt(
      viewMatrix,
      vec3.fromValues(this.position.x, this.position.y, this.position.z),
      this.lookAt,
      vec3.fromValues(0, 1, 0)
    );

    mat4.rotateX(viewMatrix, viewMatrix, this.rotation.x);
    mat4.rotateY(viewMatrix, viewMatrix, this.rotation.y);
    mat4.rotateZ(viewMatrix, viewMatrix, this.rotation.z);

    return viewMatrix;
  }

  public getProjectionMatrix(): mat4 {
    let projectionMatrix = mat4.create();

    return projectionMatrix;
  }

  public getCameraViewProjMatrix(): mat4 {
    const viewProjMatrix = mat4.create();
    const view = this.getViewMatrix();
    const proj = this.getProjectionMatrix();
    mat4.multiply(viewProjMatrix, proj, view);
    return viewProjMatrix;
  }
}

export { Camera };
