import { Geometry } from "./Geometry";
import { vec3 } from "gl-matrix";
import cubeVert from "../../shaders/basicVert.wgsl";
import cubeFrag from "../../shaders/basicFrag.wgsl";

class Sphere extends Geometry {
  public radius: number;
  public widthSegments: number;
  public heightSegments: number;

  public phiStart = 0;
  public phiLength = Math.PI * 2;
  public thetaStart = 0;
  public thetaLength = Math.PI;

  private perVertex = 3 + 3 + 2;
  private stride = this.perVertex * 4;

  private renderPipeline: GPURenderPipeline;
  private device: GPUDevice;
  private camera;
  private indexData: Uint32Array;

  constructor(radius: number, widthSegments = 20, heightSegments = 20) {
    super();
    this.device = gpu.device;
    this.camera = gpu.camera;
    this.radius = radius;
    this.widthSegments = Math.max(3, Math.floor(widthSegments));
    this.heightSegments = Math.max(2, Math.floor(heightSegments));

    const { attributes, indices } = this.createSphere(
      this.radius,
      this.widthSegments,
      this.heightSegments
    );

    this.attributes = attributes;
    this.indexData = new Uint32Array(indices);

    this.createPipeline();
    this.createVertexBuffer();
    this.createIndexBuffer();
    this.createTransformGroup();
  }

  private createPipeline() {
    this.renderPipeline = this.device.createRenderPipeline({
      label: "Plane pipeline",
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({ code: cubeVert }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: this.stride, // ( 3 (pos) + 3 (norm) + 2 (uv) ) * 4 bytes
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              {
                // norm
                shaderLocation: 1,
                offset: 3 * 4,
                format: "float32x3",
              },
              {
                // uv
                shaderLocation: 2,
                offset: (3 + 3) * 4,
                format: "float32x2",
              },
            ],
          } as GPUVertexBufferLayout,
        ],
      },
      fragment: {
        module: this.device.createShaderModule({ code: cubeFrag }),
        entryPoint: "main",
        targets: [
          {
            format: "bgra8unorm",
          },
        ],
      },
      primitive: {
        topology: "triangle-strip",
        cullMode: "none",
        stripIndexFormat: "uint32",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      multisample: {
        count: 4,
      },
    });
  }

  private createVertexBuffer() {
    this.verticesBuffer = this.device.createBuffer({
      size: this.attributes.length * this.stride,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    const mapping = new Float32Array(this.verticesBuffer.getMappedRange());
    for (let i = 0; i < this.attributes.length; i++) {
      // (3 * 4) + (3 * 4) + (2 * 4)
      mapping.set(
        [
          this.attributes[i].position[0],
          this.attributes[i].position[1],
          this.attributes[i].position[2],
        ],
        this.perVertex * i + 0
      );
      mapping.set(this.attributes[i].normals, this.perVertex * i + 3);
      mapping.set(this.attributes[i].uvs, this.perVertex * i + 6);
    }

    this.verticesBuffer.unmap();
  }

  private createIndexBuffer() {
    this.indexBuffer = this.device.createBuffer({
      size: this.indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(this.indexData);
    this.indexBuffer.unmap();
  }

  private createTransformGroup() {
    this.transformationBuffer = this.device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.transformationBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.transformationBuffer,
            offset: 0,
            size: this.matrixSize * 3,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.camera.uniformBuffer,
            offset: 0,
            size: this.matrixSize,
          },
        },
      ],
    });
  }

  private createSphere(
    radius = 1,
    widthSegments = 20,
    heightSegments = 20,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI
  ) {
    let index = 0;
    const grid = [];
    const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);

    const attributes = [];
    const indices = [];
    const vertex = vec3.create();
    const normal = vec3.create();

    // generate vertices, normals and uvs

    for (let iy = 0; iy <= heightSegments; iy++) {
      const verticesRow = [];

      const v = iy / heightSegments;

      // special case for the poles

      let uOffset = 0;

      if (iy == 0 && thetaStart == 0) {
        uOffset = 0.5 / widthSegments;
      } else if (iy == heightSegments && thetaEnd == Math.PI) {
        uOffset = -0.5 / widthSegments;
      }

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;

        // vertex

        vertex[0] =
          -radius *
          Math.cos(phiStart + u * phiLength) *
          Math.sin(thetaStart + v * thetaLength);
        vertex[1] = radius * Math.cos(thetaStart + v * thetaLength);
        vertex[2] =
          radius *
          Math.sin(phiStart + u * phiLength) *
          Math.sin(thetaStart + v * thetaLength);

        // normal
        vec3.normalize(normal, vertex);

        attributes.push({
          position: [vertex[0], vertex[1], vertex[2]],
          normals: [normal[0], normal[1], normal[2]],
          uvs: [u + uOffset, 1 - v],
        });

        verticesRow.push(index++);
      }

      grid.push(verticesRow);
    }

    // indices

    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];

        if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1 || thetaEnd < Math.PI)
          indices.push(b, c, d);
      }
    }

    return { attributes, indices: new Uint16Array(indices.flat()) };
  }

  public draw(passEncoder: GPURenderPassEncoder, device: GPUDevice) {
    this.updateTransformationMatrix();

    passEncoder.setPipeline(this.renderPipeline);
    device.queue.writeBuffer(
      this.transformationBuffer,
      0,
      this.transformMatrix.buffer,
      this.transformMatrix.byteOffset,
      this.transformMatrix.byteLength
    );

    device.queue.writeBuffer(
      this.transformationBuffer,
      64,
      this.rotateMatrix.buffer,
      this.rotateMatrix.byteOffset,
      this.rotateMatrix.byteLength
    );

    passEncoder.setVertexBuffer(0, this.verticesBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint32");
    passEncoder.setBindGroup(0, this.transformationBindGroup);
    passEncoder.drawIndexed(this.indexData.length, 1);
  }
}

export { Sphere };
