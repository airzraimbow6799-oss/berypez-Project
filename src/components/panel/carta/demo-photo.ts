import { compressPhoto } from "@/features/carta/compress-photo";
import type { DishImage } from "@/features/carta/schema";

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la foto."));
    reader.readAsDataURL(blob);
  });
}

/**
 * «Subida» del modo demostración: la foto se achica y se guarda dentro del propio dato (data URL),
 * así sigue viéndose al recargar y en la web de este navegador. No sale del dispositivo.
 */
export async function demoPhoto(file: File): Promise<DishImage> {
  let blob: Blob = file;
  try {
    blob = await compressPhoto(file);
  } catch {
    // Si el navegador no puede achicarla, se guarda tal cual.
  }
  return { url: await readAsDataUrl(blob), alt: "" };
}
