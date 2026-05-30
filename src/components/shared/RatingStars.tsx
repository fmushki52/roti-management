'use client';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export function RatingStars({ rating, onChange, size = 20 }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''}`}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
}
