struct Uniforms {
    transform : mat4x4<f32>,    // translate AND rotate
    rotate : mat4x4<f32>,
    scale : mat4x4<f32>
};

struct Camera {     // 4x4 transform matrix
    mvpMatrix : mat4x4<f32>
};

struct VertexOutput {
    
  @builtin(position) Position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) fragUV : vec2<f32>,
};


@group(0) @binding(0) var<uniform> modelTransform: Uniforms;
@group(0) @binding(1) var<uniform> camera: Camera;

struct VertexInput {
    @location(0) position : vec4<f32>,
    @location(1) norm : vec3<f32>,
    @location(2) uv : vec2<f32>
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    var inputPos: vec4<f32> = input.position;
    output.Position =  camera.mvpMatrix * modelTransform.transform * modelTransform.rotate * inputPos;
    output.fragUV = input.uv;
    output.normal = input.norm;
    return output;
}