import { Geometry } from "./Geometry";
import cubeVert from "../../shaders/basicVert.wgsl";
import cubeFrag from "../../shaders/basicFrag.wgsl";

class Plane extends Geometry {
  public width: number = 1;
  public height: number = 1;

  public numSegX: number = 1;
  public numSegY: number = 1;

  private perVertex = 3 + 3 + 2; // 3 for position, 3 for normal, 2 for uv
  private stride = this.perVertex * 4; // stride = byte length of vertex data array

  private renderPipeline: GPURenderPipeline;
  private device: GPUDevice;
  private indexData: Uint32Array;
  private camera;

  constructor(width: number, height: number, numSegX: number, numSegY: number) {
    super();
    this.device = gpu.device;
    this.camera = gpu.camera;
    this.width = width;
    this.height = height;
    this.numSegX = numSegX;
    this.numSegY = numSegY;
    const { attributes, indices } = this.createPlane(
      this.width,
      this.height,
      this.numSegX,
      this.numSegY
    );

    this.attributes = attributes;
    this.indexData = new Uint32Array(indices);
    this.createPipeline();
    this.createVertexBuffer();
    this.createIndexBuffer();
    this.createTransformGroup();
  }

  private createPlane(
    width = 1,
    height = 1,
    widthSegments = 1,
    heightSegments = 1
  ) {
    const attributes = [];
    const indices = [];

    const width_half = width / 2;
    const height_half = height / 2;

    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const segment_width = width / gridX;
    const segment_height = height / gridY;

    //

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segment_height - height_half;

      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segment_width - width_half;

        attributes.push({
          position: [x, y, 0],
          normals: [0, 0, 1],
          uvs: [ix / gridX, 1 - iy / gridY],
        });
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = ix + 1 + gridX1 * (iy + 1);
        const d = ix + 1 + gridX1 * iy;

        indices.push(d, a, b);
        indices.push(d, b, c);
      }
    }

    return { attributes, indices };
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
        topology: "line-strip",
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
      mapping.set(this.attributes[i].position, this.perVertex * i + 0);
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
    passEncoder.drawIndexed(this.indexData.length, 3);
  }
}

export { Plane };
