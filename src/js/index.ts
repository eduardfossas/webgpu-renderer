import { Renderer } from "components/Renderer";
import { WGPU } from "components/WGPU";
import { PerspectiveCamera } from "components/Camera";
import { Scene } from "components/Scene";
import { Sphere } from "components/Geometry";

global.gpu = new WGPU();

const createApp = async () => {
  await gpu.init();
  const renderer = new Renderer();
  const camera = new PerspectiveCamera(gpu.canvas.width / gpu.canvas.height);
  camera.position.z = -3;

  const scene = new Scene();

  gpu.camera = camera;

  const sphere = new Sphere(1, 32, 32);

  scene.add(sphere);

  const draw = () => {
    sphere.rotation.x += 0.01;
    renderer.render(camera, scene);
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);

  window.onresize = () => {
    gpu.canvas.width = window.innerWidth;
    gpu.canvas.height = window.innerHeight;
    camera.aspect = gpu.canvas.width / gpu.canvas.height;
    renderer.update();
  };
};

createApp();
