import { Star } from "lucide-react";

export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating * 2) / 2; // meia estrela
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Avaliação ${rating.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rounded);
        const half = !filled && i - 0.5 <= rounded;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-ink-200" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} aria-hidden />
            {(filled || half) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: half ? size / 2 : size }}>
                <Star className="text-brand-500" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} aria-hidden />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
      <Star className="size-3 fill-brand-500 text-brand-500" aria-hidden />
      {rating.toFixed(1)}
    </span>
  );
}
