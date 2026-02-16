export async function compressImage(file: File, maxSizeKB = 200, maxDimension = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Resize if too large
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Loop compress quality
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Gagal kompresi gambar"));
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                });
                resolve(compressed);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };
        tryCompress();
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}
