import { Geometry } from "./Geometry";
import cubeVert from "../../shaders/basicVert.wgsl";
import cubeFrag from "../../shaders/basicFrag.wgsl";
import { vec3 } from "gl-matrix";
import { cube } from "primitive-geometry";

const attributes: any[] = [];
const indices: any[] = [];
const numberOfVertices = 0;

const cubeGeometry = cube({
  sx: 1,
  sy: 1,
  sz: 1,
  nx: 1,
  ny: 1,
  nz: 1,
});

console.log(cubeGeometry);

export class Cube extends Geometry {
  public props: {
    depth: number;
    height: number;
    width: number;
    depthSegments: number;
    heightSegments: number;
    widthSegments: number;
  };

  private indices = [];

  private perVertex = 3 + 3 + 2; // 3 for position, 3 for normal, 2 for uv
  private stride = this.perVertex * 4; // stride = byte length of vertex data array

  private renderPipeline: GPURenderPipeline;
  private device: GPUDevice;
  private indexData: Uint32Array;
  private camera;

  constructor(
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    depthSegments: number = 1
  ) {
    super();
    this.device = gpu.device;
    this.camera = gpu.camera;
    this.props = {
      width,
      height,
      depth,
      widthSegments,
      heightSegments,
      depthSegments,
    };
    this.indices = [];
    this.numberOfVertices = 0;
    this.attributes = [];
    this.indices = [];

    this.createCube();
    console.log(this.indices);
    console.log(this.attributes);
    this.indexData = new Uint32Array(this.indices);
    this.createPipeline();
    this.createVertexBuffer();
    this.createIndexBuffer();
    this.createTransformGroup();
  }

  private createPlane(
    u: number,
    v: number,
    w: number,
    udir: number,
    vdir: number,
    width: number,
    height: number,
    depth: number,
    gridX: number,
    gridY: number
  ) {
    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;

    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const depthHalf = depth / 2;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    let vertexCounter = 0;
    const vector = vec3.create();
    const vectorN = vec3.create();

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;

      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;

        // set values to correct vector component

        vector[u] = x * udir;
        vector[v] = y * vdir;
        vector[w] = depthHalf;

        vectorN[u] = 0;
        vectorN[v] = 0;
        vectorN[w] = depth > 0 ? 1 : -1;

        this.attributes.push({
          position: [vector[u], vector[v], vector[w]],
          normals: [vectorN[u], vectorN[v], vectorN[w]],
          uvs: [ix / gridX, 1 - iy / gridY],
        });

        vertexCounter += 1;
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = this.numberOfVertices + ix + gridX1 * iy;
        const b = this.numberOfVertices + ix + gridX1 * (iy + 1);
        const c = this.numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
        const d = this.numberOfVertices + (ix + 1) + gridX1 * iy;

        // faces

        this.indices.push(a, d, c);
        this.indices.push(a, c, d);
      }
    }

    this.numberOfVertices += vertexCounter;
  }

  private createCube() {
    this.attributes.push(
      {
        position: [-0.5, 0.5, 0.5],
        uvs: [0.0, 1.0],

        normals: [0.0, 0.0, 1.0],
      },
      {
        position: [0.5, 0.5, 0.5],
        uvs: [1.0, 1.0],

        normals: [0.0, 0.0, 1.0],
      },
      {
        position: [-0.5, -0.5, 0.5],
        uvs: [0.0, 0.0],

        normals: [0.0, 0.0, 1.0],
      },
      {
        position: [0.5, -0.5, 0.5],
        uvs: [1.0, 0.0],

        normals: [0.0, 0.0, 1.0],
      },
      //back
      {
        position: [0.5, 0.5, -0.5],
        uvs: [1.0, 0.0],

        normals: [-1.0, 0.0, 0.0],
      },
      {
        position: [-0.5, 0.5, -0.5],
        uvs: [0.0, 0.0],

        normals: [-1.0, 0.0, 0.0],
      },
      {
        position: [0.5, -0.5, -0.5],
        uvs: [1.0, 1.0],

        normals: [-1.0, 0.0, 0.0],
      },
      {
        position: [-0.5, -0.5, -0.5],
        uvs: [0.0, 1.0],

        normals: [-1.0, 0.0, 0.0],
      },
      {
        position: [-0.5, 0.5, -0.5],
        uvs: [1.0, 0.0],

        normals: [0.0, 0.0, -1.0],
      },
      {
        position: [-0.5, 0.5, 0.5],
        uvs: [0.0, 0.0],

        normals: [0.0, 0.0, -1.0],
      },
      {
        position: [-0.5, -0.5, -0.5],
        uvs: [1.0, 1.0],

        normals: [0.0, 0.0, -1.0],
      },
      {
        position: [-0.5, -0.5, 0.5],
        uvs: [0.0, 1.0],

        normals: [0.0, 0.0, -1.0],
      },
      {
        position: [0.5, 0.5, 0.5],
        uvs: [1.0, 0.0],

        normals: [1.0, 0.0, 0.0],
      },
      {
        position: [0.5, 0.5, -0.5],
        uvs: [0.0, 0.0],

        normals: [1.0, 0.0, 0.0],
      },
      {
        position: [0.5, -0.5, 0.5],
        uvs: [1.0, 1.0],

        normals: [1.0, 0.0, 0.0],
      },
      {
        position: [0.5, -0.5, -0.5],
        uvs: [0.0, 1.0],

        normals: [1.0, 0.0, 0.0],
      },
      {
        position: [-0.5, 0.5, -0.5],
        uvs: [0.0, 1.0],

        normals: [0.0, -1.0, 0.0],
      },
      {
        position: [0.5, 0.5, -0.5],
        uvs: [1.0, 1.0],

        normals: [0.0, -1.0, 0.0],
      },
      {
        position: [-0.5, 0.5, 0.5],
        uvs: [0.0, 0.0],

        normals: [0.0, -1.0, 0.0],
      },
      {
        position: [0.5, 0.5, 0.5],
        uvs: [1.0, 0.0],

        normals: [0.0, -1.0, 0.0],
      },
      {
        position: [-0.5, -0.5, 0.5],
        uvs: [0.0, 1.0],

        normals: [0.0, 1.0, 0.0],
      },
      {
        position: [0.5, -0.5, 0.5],
        uvs: [1.0, 1.0],

        normals: [0.0, 1.0, 0.0],
      },
      {
        position: [-0.5, -0.5, -0.5],
        uvs: [0.0, 0.0],

        normals: [0.0, 1.0, 0.0],
      },
      {
        position: [0.5, -0.5, -0.5],
        uvs: [1.0, 0.0],

        normals: [0.0, 1.0, 0.0],
      }
    );

    this.indices.push(
      0,
      2,
      3,
      0,
      3,
      1,
      4,
      6,
      7,
      4,
      7,
      5,
      8,
      10,
      11,
      8,
      11,
      9,
      12,
      14,
      15,
      12,
      15,
      13,
      16,
      18,
      19,
      16,
      19,
      17,
      20,
      22,
      23,
      20,
      23,
      21
    );
  }

  private createPipeline() {
    this.renderPipeline = this.device.createRenderPipeline({
      label: "Cube Pipeline",
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
    passEncoder.drawIndexed(this.indexData.length, 1);
  }
}
