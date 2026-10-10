/**
 * Compresses an uploaded image file (receipt/bukti pembelanjaan) into a compact JPEG Data URL
 * suitable for fast mobile uploading and Firestore document storage (< 150KB).
 */
export async function compressReceiptImage(
  file: File,
  maxDimension: number = 850,
  quality: number = 0.68
): Promise<{ dataUrl: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih harus berupa gambar/foto (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto struk.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak dapat diproses.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal menginisialisasi pemroses gambar.'));
          return;
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still over 280KB, reduce quality slightly to stay well within Firestore limits
        if (compressedDataUrl.length > 280000) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        }

        const safeFileName = (file.name || 'struk-belanja.jpg').slice(0, 100);
        resolve({
          dataUrl: compressedDataUrl,
          fileName: safeFileName,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
