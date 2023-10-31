import { Camera } from "components/Camera";

class Renderer {
  private tex: GPUTexture;
  private depthTexture: GPUTexture;
  private renderDescription: GPURenderPassDescriptor;
  private presentationSize: number[];

  constructor() {
    this.tex;
    gpu.canvas.width = window.innerWidth;
    gpu.canvas.height = window.innerHeight;
    this.presentationSize = [
      gpu.canvas.clientWidth,
      gpu.canvas.clientHeight,
      1,
    ];
    this.init();
  }

  setTexture() {
    return gpu.device
      .createTexture({
        size: this.presentationSize,
        format: gpu.format,
        sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      })
      .createView();
  }

  setDepthTexture() {
    return gpu.device
      .createTexture({
        size: this.presentationSize,
        format: "depth24plus",
        sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      })
      .createView();
  }

  setClearColor(color = "") {
    return { r: 0.9, g: 0.9, b: 0.9, a: 1.0 };
  }

  render(camera: Camera, scene: any) {
    const cameraViewProjectionMatrix =
      camera.getCameraViewProjMatrix() as Float32Array;
    gpu.device.queue.writeBuffer(
      camera.uniformBuffer,
      0,
      cameraViewProjectionMatrix.buffer,
      cameraViewProjectionMatrix.byteOffset,
      cameraViewProjectionMatrix.byteLength
    );

    this.renderDescription.colorAttachments[0].resolveTarget = gpu.ctx
      .getCurrentTexture()
      .createView();
    this.renderDescription.depthStencilAttachment.resolveTarget = gpu.ctx
      .getCurrentTexture()
      .createView();

    const commandEncoder = gpu.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();

    for (let computeObjects of scene.getComputeObjects()) {
      computeObjects.drawCompute(computePass, gpu.device);
    }

    computePass.end();

    const renderPass = commandEncoder.beginRenderPass(this.renderDescription);

    for (let object of scene.getObjects()) {
      object.draw(renderPass, gpu.device);
    }

    renderPass.end();
    gpu.device.queue.submit([commandEncoder.finish()]);
  }

  update() {
    this.presentationSize = [gpu.canvas.width, gpu.canvas.height];
    this.renderDescription.colorAttachments[0].view = this.setTexture();
    this.renderDescription.depthStencilAttachment.view = this.setDepthTexture();
  }

  init() {
    this.renderDescription = {
      colorAttachments: [
        {
          view: this.setTexture(),
          resolveTarget: gpu.ctx.getCurrentTexture().createView(),
          clearValue: this.setClearColor(), //background color
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.setDepthTexture(),
        resolveTarget: gpu.ctx.getCurrentTexture().createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }
}

export { Renderer };
