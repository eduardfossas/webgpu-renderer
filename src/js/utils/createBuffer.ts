export const createBuffer = (
  label: string = "",
  device: GPUDevice,
  arr: Float32Array | Uint32Array,
  usage: GPUBufferUsageFlags
) => {
  // 📏 Align to 4 bytes (thanks @chrimsonite)
  let desc = {
    label,
    size: (arr.byteLength + 3) & ~3,
    usage,
    mappedAtCreation: true,
  };
  let buffer = device.createBuffer(desc);

  const writeArray =
    arr instanceof Uint16Array
      ? new Uint16Array(buffer.getMappedRange())
      : new Float32Array(buffer.getMappedRange());
  writeArray.set(arr);
  buffer.unmap();
  return buffer;
};
