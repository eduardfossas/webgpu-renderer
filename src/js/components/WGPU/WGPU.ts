class WGPU {
  device: GPUDevice;
  ctx: GPUCanvasContext;
  devicePixel: number;
  format: GPUTextureFormat;

  private entry: GPU;
  private adapter: GPUAdapter;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.entry = navigator.gpu;
    this.canvas = document.querySelector("[js-canvas]");
    this.ctx = this.canvas.getContext("webgpu");
    this.devicePixel = Math.round(Math.min(1, window.devicePixelRatio));
  }

  async init() {
    this.adapter = await this.entry.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.format = this.entry.getPreferredCanvasFormat();
    this.ctx.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });
  }
}

export { WGPU };
