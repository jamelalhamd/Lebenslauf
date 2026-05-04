export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAdjustments {
  brightness: number;  // 0–200, default 100
  contrast: number;    // 0–200, default 100
  saturation: number;  // 0–200, default 100
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: CropArea,
  adjustments: ImageAdjustments,
  outputSize = 400,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  ctx.filter = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
  ].join(' ');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL('image/jpeg', 0.88);
}
