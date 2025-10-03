export const getCroppedImg = (imageSrc, pixelCrop, outputSize = 300) => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "Anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );
      resolve(canvas.toDataURL('image/jpeg'));
    };
    image.onerror = error => reject(error);
  });
};
