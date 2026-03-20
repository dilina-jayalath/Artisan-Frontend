import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export default function StarRating({ rating, onChange, size = 16 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={onChange ? "cursor-pointer hover:scale-110 transition-transform active:scale-95" : "cursor-default"}
        >
          <Star
            size={size}
            className={star <= rating ? "fill-accent text-accent" : "text-border"}
          />
        </button>
      ))}
    </div>
  );
}
