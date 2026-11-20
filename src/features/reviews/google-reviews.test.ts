import { describe, expect, it, vi } from "vitest";

import { getGoogleReviews, pickFiveStar } from "./google-reviews";

const LINCE = { branch: "Lince", placeId: null, query: "Berypez Calle Los Mirtos 315 Lince Lima" };

function respuesta(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe("pickFiveStar", () => {
  it("deja solo las reseñas de 5 estrellas con texto, sin cambiarlas", () => {
    const reviews = pickFiveStar("Lince", {
      reviews: [
        {
          rating: 5,
          originalText: { text: "  Excelente ceviche  " },
          authorAttribution: { displayName: "Ana" },
          relativePublishTimeDescription: "hace 2 semanas",
          googleMapsUri: "https://maps.google.com/r/1",
        },
        { rating: 4, text: { text: "Bueno" } },
        { rating: 5 },
      ],
    });
    expect(reviews).toEqual([
      {
        branch: "Lince",
        author: "Ana",
        text: "Excelente ceviche",
        when: "hace 2 semanas",
        href: "https://maps.google.com/r/1",
      },
    ]);
  });
});

describe("getGoogleReviews", () => {
  it("sin clave no llama a Google", async () => {
    const fetcher = vi.fn();
    expect(await getGoogleReviews([LINCE], undefined, fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("busca el lugar, lee calificación y reseñas, y manda la clave solo en la cabecera", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(respuesta({ places: [{ id: "abc123" }] }))
      .mockResolvedValueOnce(
        respuesta({
          rating: 4.6,
          userRatingCount: 1300,
          googleMapsUri: "https://maps.google.com/?cid=1",
          reviews: [{ rating: 5, text: { text: "¡Todo rico!" } }],
        }),
      );

    const result = await getGoogleReviews([LINCE], "clave-de-prueba", fetcher);

    expect(result?.ratings).toEqual([
      { branch: "Lince", rating: 4.6, count: 1300, href: "https://maps.google.com/?cid=1" },
    ]);
    expect(result?.reviews).toHaveLength(1);
    const [url, init] = fetcher.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://places.googleapis.com/v1/places/abc123?languageCode=es");
    expect(url).not.toContain("clave-de-prueba");
    expect((init.headers as Record<string, string>)["X-Goog-Api-Key"]).toBe("clave-de-prueba");
  });

  it("si Google falla, devuelve null y la página sigue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = vi.fn().mockResolvedValue(respuesta({}, false, 403));
    expect(await getGoogleReviews([LINCE], "clave", fetcher)).toBeNull();
  });
});
