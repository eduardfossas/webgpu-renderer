import { Camera } from "./Camera";
import { mat4 } from "gl-matrix";

class PerspectiveCamera extends Camera {
  constructor(aspect: number) {
    super(aspect);
  }

  public getProjectionMatrix(): mat4 {
    let projectionMatrix = mat4.create();
    mat4.perspective(
      projectionMatrix,
      this.fovy,
      this.aspect,
      this.near,
      this.far
    );
    return projectionMatrix;
  }
}

export { PerspectiveCamera };
