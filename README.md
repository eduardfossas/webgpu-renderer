# Webgpu Renderer

---

This is a small practice to understand the new Webgpu API. I am not a Graphics Engineer, so probably a lot of mistakes were made but you are more than welcome to collaborate.

## Prerequisites

Download the repo and do `npm i` and then `npm start` to see this:

![Screenshot 2023-10-31 at 21.50.36.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/b343dac1-1d9c-4370-9f82-d38789d3f4c4/d5e7f11d-e616-4d36-be18-3c6ec280ee4e/Screenshot_2023-10-31_at_21.50.36.png)

## Usage

It was hugely inspired by how three.js works; you set a renderer, a scene, and a camera and you render them in a request animation frame, the only difference is that we need to request the WebGPU in advance and we will need to pass the camera to make it globally available:

```jsx
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

  const draw = () => {
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
```

Now, we can import a geometry like a sphere and add it to the scene:

```jsx
import { Renderer } from "components/Renderer";
import { WGPU } from "components/WGPU";
import { PerspectiveCamera } from "components/Camera";
import { Scene } from "components/Scene";
**import { Sphere } from "components/Geometry";**

global.gpu = new WGPU();

const createApp = async () => {
  await gpu.init();
  const renderer = new Renderer();
  const camera = new PerspectiveCamera(gpu.canvas.width / gpu.canvas.height);
  camera.position.z = -3;

  const scene = new Scene();
  gpu.camera = camera;
  **const sphere = new Sphere(1, 32, 32);
  scene.add(sphere);**

  const draw = () => {
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
```

You can now make the sphere rotate like so:

```jsx
import { Renderer } from "components/Renderer";
import { WGPU } from "components/WGPU";
import { PerspectiveCamera } from "components/Camera";
import { Scene } from "components/Scene";
**import { Sphere } from "components/Geometry";**

global.gpu = new WGPU();

const createApp = async () => {
  await gpu.init();
  const renderer = new Renderer();
  const camera = new PerspectiveCamera(gpu.canvas.width / gpu.canvas.height);
  camera.position.z = -3;

  const scene = new Scene();
  gpu.camera = camera;
  **const sphere = new Sphere(1, 32, 32);
  scene.add(sphere);**

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
```

If everything goes well, you should see this:

![Screenshot 2023-10-31 at 21.50.36.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/b343dac1-1d9c-4370-9f82-d38789d3f4c4/d5e7f11d-e616-4d36-be18-3c6ec280ee4e/Screenshot_2023-10-31_at_21.50.36.png)
