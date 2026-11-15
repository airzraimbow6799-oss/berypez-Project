import { describe, expect, it } from "vitest";

import { cleanName, cleanText } from "./text";

describe("cleanText", () => {
  it("quita etiquetas HTML y decodifica entidades", () => {
    expect(cleanText("<p>Pescado &amp; mariscos &#8211; fresco</p>")).toBe(
      "Pescado & mariscos – fresco",
    );
  });

  it("une párrafos y colapsa espacios", () => {
    expect(cleanText("<p>Uno.</p>\n<p>  Dos   tres </p>")).toBe("Uno. Dos tres");
  });

  it("corrige la ortografía detectada en la auditoría (Anexo B)", () => {
    expect(cleanText("Espaguetti con bisteck en brunua y langotinos")).toBe(
      "Espagueti con bistec en brunoise y langostinos",
    );
  });

  it("devuelve cadena vacía si no hay contenido", () => {
    expect(cleanText("<p> </p>")).toBe("");
  });

  it("decodifica entidades numéricas hexadecimales y nbsp", () => {
    expect(cleanText("S/&nbsp;42 &#x2013; &quot;ok&quot;")).toBe('S/ 42 – "ok"');
  });
});

describe("cleanName", () => {
  it("quita el sufijo (Copiar) y el punto final", () => {
    expect(cleanName("Papaya, piña, fresa o naranja.")).toBe("Papaya, piña, fresa o naranja");
    expect(cleanName("Ceviche de conchas negras (Copiar)")).toBe("Ceviche de conchas negras");
  });

  it("aplica tildes en Dúos y Tríos", () => {
    expect(cleanName("Duos y trios")).toBe("Dúos y tríos");
  });
});
