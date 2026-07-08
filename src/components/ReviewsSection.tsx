'use client';

import { useState, useCallback, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { listReviews, type ReviewRow } from '@/lib/api';

interface ReviewsSectionProps {
  programId?: string;
  institutionId?: string;
}

// This site is statically exported (output: 'export'), so program detail
// pages are pre-rendered at build time. Reviews get added continuously, so
// fetching them client-side (like the homepage/AI search already do for
// their own data) keeps this section live instead of frozen at last deploy -
// and avoids making every one of ~139 program pages depend on the backend
// API being reachable during every build.
export function ReviewsSection({ programId, institutionId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await listReviews({ program_id: programId, institution_id: institutionId, limit: 50 });
      setReviews(res.reviews);
      setTotal(res.meta.total);
    } catch {
      // Leave whatever's already showing in place rather than clearing it out.
    } finally {
      setLoading(false);
    }
  }, [programId, institutionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Reviews
            {total > 0 && <span className="text-gray-500 font-normal text-base">({total})</span>}
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">{avgRating.toFixed(1)} average</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {showForm && (
        <ReviewForm
          programId={programId}
          institutionId={institutionId}
          onSubmit={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience.</p>
      ) : (
        reviews.map((review) => <ReviewCard key={review.id} review={review} />)
      )}
    </div>
  );
}
