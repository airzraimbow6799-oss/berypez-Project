/**
 * Achica la foto en el navegador antes de subirla: WebP, máximo 1200 px de ancho y menos de
 * 280 KB (el bucket acepta hasta 300 KB). Así la carta carga rápido en celular.
 */
export const MAX_UPLOAD_BYTES = 280_000;
const MAX_WIDTH = 1200;
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

export async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  let width = Math.min(MAX_WIDTH, bitmap.width);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const height = Math.round((bitmap.height * width) / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.type === "image/webp" && blob.size <= MAX_UPLOAD_BYTES) {
        bitmap.close();
        return new File([blob], "foto.webp", { type: "image/webp" });
      }
    }
    width = Math.round(width * 0.75);
  }
  bitmap.close();
  throw new Error("No se pudo achicar la foto. Prueba con otra imagen.");
}
