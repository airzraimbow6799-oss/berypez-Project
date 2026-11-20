import { ArrowUpRight, Star } from "lucide-react";
import type { CSSProperties } from "react";

import { BRANCHES } from "@/config/site";
import { getGoogleReviews, type PlaceQuery } from "@/features/reviews/google-reviews";

const QUERIES: PlaceQuery[] = BRANCHES.map((b) => ({
  branch: b.name,
  placeId: null,
  query: `Berypez ${b.address ?? ""} ${b.name} Lima`,
}));

function Stars({ value }: { value: number }) {
  return (
    <span className="text-aji flex" aria-label={`${value} de 5 estrellas`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`size-5 ${i < Math.round(value) ? "fill-current" : "opacity-30"}`}
        />
      ))}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Reseñas de 5 estrellas de Google Maps (se actualizan una vez al día). Sin clave de Google
 * configurada, muestra enlaces para leer las reseñas directamente en Google Maps.
 */
export async function GoogleReviews() {
  const data = await getGoogleReviews(QUERIES);

  return (
    <section aria-labelledby="resenas" className="bg-crema-200">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-rocoto-texto text-sm font-semibold tracking-wide uppercase">
          Lo que dicen en Google Maps
        </p>
        <h2 id="resenas" data-reveal className="titulo-ola mt-2 text-3xl font-semibold">
          Cinco estrellas de nuestros clientes
        </h2>

        {data && data.ratings.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-4">
            {data.ratings.map((r) => (
              <li
                key={r.branch}
                className="bg-superficie border-borde flex items-center gap-3 rounded-md border px-4 py-3"
              >
                <span className="font-display text-marino text-3xl font-semibold">
                  {r.rating.toFixed(1)}
                </span>
                <span>
                  <Stars value={r.rating} />
                  <span className="text-tinta-suave text-sm">
                    {r.branch} · {r.count.toLocaleString("es-PE")} reseñas
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {data && data.reviews.length > 0 ? (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.reviews.slice(0, 6).map((review, index) => (
              <li
                key={`${review.branch}-${review.author}-${index}`}
                data-reveal
                style={{ "--i": index % 3 } as CSSProperties}
                className="bg-superficie border-borde flex flex-col rounded-md border p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="bg-marino text-crema flex size-10 items-center justify-center rounded-full text-sm font-semibold"
                  >
                    {initials(review.author)}
                  </span>
                  <span>
                    <span className="text-marino block font-semibold">{review.author}</span>
                    <span className="text-tinta-suave text-sm">
                      {review.branch}
                      {review.when ? ` · ${review.when}` : ""}
                    </span>
                  </span>
                </div>
                <Stars value={5} />
                <p className="text-tinta mt-3 line-clamp-6 flex-1">{review.text}</p>
                {review.href ? (
                  <a
                    href={review.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-marino-600 mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                  >
                    Ver en Google
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                    <span className="sr-only"> la reseña de {review.author}</span>
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-tinta-suave mt-4 max-w-2xl text-lg">
            Lee lo que cuentan nuestros clientes y deja tu reseña después de visitarnos.
          </p>
        )}

        <p className="mt-6 flex flex-wrap gap-3">
          {BRANCHES.flatMap((b) =>
            b.mapsUrl
              ? [
                  <a
                    key={b.slug}
                    href={b.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-marino text-marino hover:bg-marino hover:text-crema rounded-pill min-h-tactil inline-flex items-center gap-2 border-2 px-5 font-semibold transition-colors"
                  >
                    Reseñas de {b.name} en Google Maps
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>,
                ]
              : [],
          )}
        </p>
        {data && data.reviews.length > 0 ? (
          <p className="text-tinta-suave mt-4 text-xs">
            Reseñas de Google. Se muestran las de 5 estrellas, tal como las escribieron.
          </p>
        ) : null}
      </div>
    </section>
  );
}
