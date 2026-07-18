'use client';

import { useState } from 'react';
import { Star, ThumbsUp, Check, X } from 'lucide-react';
import { markReviewHelpful } from '@/lib/api';

interface Review {
  id: string;
  reviewer_name: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string | null;
  cons: string | null;
  would_recommend: boolean | null;
  helpful_count: number;
  created_at: string;
}

export function ReviewCard({ review }: { review: Review }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [marked, setMarked] = useState(false);
  const [marking, setMarking] = useState(false);

  async function handleHelpful() {
    if (marked || marking) return;
    setMarking(true);
    try {
      await markReviewHelpful(review.id);
      setHelpfulCount((c) => c + 1);
      setMarked(true);
    } catch {
      // Non-critical action - fail silently rather than interrupt reading the review.
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="bg-elimux-card rounded-lg border border-border p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-400/10 flex items-center justify-center text-primary-400 font-bold">
            {review.reviewer_name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-semibold text-foreground">{review.reviewer_name || 'Anonymous'}</p>
            <p className="text-sm text-muted">{new Date(review.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
          ))}
        </div>
      </div>

      {review.title && <h3 className="font-semibold text-lg text-foreground mb-2">{review.title}</h3>}
      {review.content && <p className="text-muted mb-4">{review.content}</p>}

      {review.pros && review.pros.trim().length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-semibold text-green-600 mb-1">Pros</p>
          <ul className="list-disc list-inside text-sm text-muted">
            {review.pros.split(',').map((pro) => pro.trim()).filter(Boolean).map((pro, i) => (
              <li key={i}>{pro}</li>
            ))}
          </ul>
        </div>
      )}

      {review.cons && review.cons.trim().length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-semibold text-red-600 mb-1">Cons</p>
          <ul className="list-disc list-inside text-sm text-muted">
            {review.cons.split(',').map((con) => con.trim()).filter(Boolean).map((con, i) => (
              <li key={i}>{con}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          onClick={handleHelpful}
          disabled={marked || marking}
          className={`flex items-center gap-1 text-sm transition-colors ${
            marked ? 'text-primary-400' : 'text-muted hover:text-primary-400'
          } disabled:cursor-default`}
        >
          <ThumbsUp className={`w-4 h-4 ${marked ? 'fill-primary-400' : ''}`} />
          Helpful ({helpfulCount})
        </button>
        {review.would_recommend !== null && (
          <span className={`flex items-center gap-1 text-sm ${review.would_recommend ? 'text-green-600' : 'text-red-600'}`}>
            {review.would_recommend ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {review.would_recommend ? 'Recommends' : 'Does not recommend'}
          </span>
        )}
      </div>
    </div>
  );
}
