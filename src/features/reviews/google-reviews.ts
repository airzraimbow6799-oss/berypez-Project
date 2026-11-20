/**
 * Reseñas de Google Maps de las sedes, con la API de Places (New).
 *
 * - Solo corre en el servidor: la clave (GOOGLE_PLACES_API_KEY) nunca llega al navegador.
 * - Se pide como mucho una vez al día por sede (caché de Next, `revalidate`): pocas llamadas al mes.
 * - Google entrega hasta 5 reseñas «más relevantes» por lugar; aquí se muestran solo las de
 *   5 estrellas, sin cambiar el texto y con el nombre de quien la escribió y enlace a la original.
 * - Sin clave o si Google falla, devuelve null y la página muestra los enlaces a Google Maps.
 */
import { z } from "zod";

const PLACES_URL = "https://places.googleapis.com/v1";
const ONE_DAY_SECONDS = 86_400;

const reviewSchema = z.object({
  rating: z.number(),
  relativePublishTimeDescription: z.string().optional(),
  publishTime: z.string().optional(),
  text: z.object({ text: z.string() }).optional(),
  originalText: z.object({ text: z.string() }).optional(),
  authorAttribution: z.object({ displayName: z.string(), uri: z.string().optional() }).optional(),
  googleMapsUri: z.string().optional(),
});

const placeSchema = z.object({
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  googleMapsUri: z.string().optional(),
  reviews: z.array(reviewSchema).optional(),
});

const searchSchema = z.object({
  places: z.array(z.object({ id: z.string() })).optional(),
});

export interface PlaceQuery {
  branch: string;
  /** Place ID de Google si se conoce; si no, se busca por texto (`query`). */
  placeId: string | null;
  query: string;
}

export interface FiveStarReview {
  branch: string;
  author: string;
  text: string;
  when: string;
  href: string | null;
}

export interface BranchRating {
  branch: string;
  rating: number;
  count: number;
  href: string | null;
}

export interface GoogleReviewsResult {
  ratings: BranchRating[];
  reviews: FiveStarReview[];
}

type Fetcher = typeof fetch;

async function resolvePlaceId(query: PlaceQuery, apiKey: string, fetcher: Fetcher) {
  if (query.placeId) {
    return query.placeId;
  }
  const response = await fetcher(`${PLACES_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: query.query, languageCode: "es", regionCode: "PE" }),
    next: { revalidate: ONE_DAY_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`Places searchText respondió ${response.status}`);
  }
  return searchSchema.parse(await response.json()).places?.[0]?.id ?? null;
}

async function fetchPlace(placeId: string, apiKey: string, fetcher: Fetcher) {
  const response = await fetcher(
    `${PLACES_URL}/places/${encodeURIComponent(placeId)}?languageCode=es`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      next: { revalidate: ONE_DAY_SECONDS },
    },
  );
  if (!response.ok) {
    throw new Error(`Places details respondió ${response.status}`);
  }
  return placeSchema.parse(await response.json());
}

/** Solo reseñas de 5 estrellas con texto, en el idioma original de quien la escribió. */
export function pickFiveStar(branch: string, place: z.infer<typeof placeSchema>): FiveStarReview[] {
  return (place.reviews ?? []).flatMap((review) => {
    const text = (review.originalText?.text ?? review.text?.text ?? "").trim();
    if (review.rating !== 5 || !text) {
      return [];
    }
    return [
      {
        branch,
        author: review.authorAttribution?.displayName ?? "Cliente de Google",
        text,
        when: review.relativePublishTimeDescription ?? "",
        href: review.googleMapsUri ?? review.authorAttribution?.uri ?? null,
      },
    ];
  });
}

export async function getGoogleReviews(
  queries: readonly PlaceQuery[],
  apiKey: string | undefined = process.env.GOOGLE_PLACES_API_KEY,
  fetcher: Fetcher = fetch,
): Promise<GoogleReviewsResult | null> {
  if (!apiKey) {
    return null;
  }
  try {
    const results = await Promise.all(
      queries.map(async (query) => {
        const placeId = await resolvePlaceId(query, apiKey, fetcher);
        if (!placeId) {
          return null;
        }
        const place = await fetchPlace(placeId, apiKey, fetcher);
        return { query, place };
      }),
    );
    const found = results.flatMap((r) => (r ? [r] : []));
    return {
      ratings: found.flatMap(({ query, place }) =>
        place.rating
          ? [
              {
                branch: query.branch,
                rating: place.rating,
                count: place.userRatingCount ?? 0,
                href: place.googleMapsUri ?? null,
              },
            ]
          : [],
      ),
      reviews: found.flatMap(({ query, place }) => pickFiveStar(query.branch, place)),
    };
  } catch (error) {
    // La página sigue funcionando sin reseñas; el detalle queda en el log del servidor.
    console.error("[reseñas] No se pudieron leer las reseñas de Google:", error);
    return null;
  }
}
