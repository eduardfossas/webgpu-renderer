import { mat4, vec3 } from "gl-matrix";

type Object3D = {
  x: number;
  y: number;
  z: number;
};

export class Geometry {
  public position: Object3D;
  public rotation: Object3D;

  public attributes: any[];
  public indices: Uint32Array;

  public matrixSize = 4 * 16; // 4x4 matrix
  public offset = 256; // transformationBindGroup offset must be 256-byte aligned
  public uniformBufferSize = this.offset;

  public transform = mat4.create();

  public transformMatrix = mat4.create() as Float32Array;
  public rotateMatrix = mat4.create() as Float32Array;
  public scaleMatrix = mat4.create() as Float32Array;

  public transformationBuffer: GPUBuffer;
  public transformationBindGroup: GPUBindGroup;
  public verticesBuffer: GPUBuffer;
  public indexBuffer: GPUBuffer;

  constructor() {
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

  private updateTransform() {}

  private updateRotation() {}

  private updateScale() {}

  public updateTransformationMatrix() {
    // MOVE / TRANSLATE OBJECT

    mat4.translate(
      this.transformMatrix,
      this.transform,
      vec3.fromValues(this.position.x, this.position.y, this.position.z)
    );
    mat4.rotateX(this.rotateMatrix, this.transform, this.rotation.x);
    mat4.rotateY(this.rotateMatrix, this.rotateMatrix, this.rotation.y);
    mat4.rotateY(this.rotateMatrix, this.rotateMatrix, this.rotation.z);
  }

  public setAttribute() {}

  public setIndex() {}
}
