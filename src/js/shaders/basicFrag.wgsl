
@fragment
fn main(@builtin(position) Position: vec4<f32>, @location(0) norm: vec3<f32>, @location(1) uv: vec2<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(vec3(norm), 1.0);
}