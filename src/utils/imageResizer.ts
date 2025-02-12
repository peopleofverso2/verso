export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  maintainAspectRatio?: boolean;
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
}

export async function resizeImage(file: File, options: ResizeOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions
      if (options.maintainAspectRatio !== false) {
        const ratio = Math.min(
          options.maxWidth / width,
          options.maxHeight / height
        );
        width = width * ratio;
        height = height * ratio;
      } else {
        width = Math.min(width, options.maxWidth);
        height = Math.min(height, options.maxHeight);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw image with smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const resizedFile = new File(
            [blob],
            file.name,
            { type: options.format || file.type }
          );
          resolve(resizedFile);
        },
        options.format || file.type,
        options.quality || 0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
