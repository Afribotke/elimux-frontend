'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { createReview } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { queueAction } from '@/lib/pwaQueue';

export function ReviewForm({
  programId,
  institutionId,
  onSubmit,
}: {
  programId?: string;
  institutionId?: string;
  onSubmit: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !title || !content) return;

    setSubmitting(true);
    setError(null);
    setQueued(false);

    // pros/cons are `text` columns in the DB — send the plain string, not an array
    const reviewPayload = {
      program_id: programId,
      institution_id: institutionId,
      reviewer_name: reviewerName || undefined,
      reviewer_email: reviewerEmail || undefined,
      rating,
      title,
      content,
      pros: pros || undefined,
      cons: cons || undefined,
      would_recommend: wouldRecommend,
    };

    function resetFields() {
      setRating(0);
      setTitle('');
      setContent('');
      setReviewerName('');
      setReviewerEmail('');
      setPros('');
      setCons('');
      setWouldRecommend(null);
    }

    try {
      if (!navigator.onLine) throw new TypeError('offline');
      await createReview(reviewPayload);

      trackEvent('review', { institution_id: institutionId, program_id: programId, rating });

      onSubmit();
      resetFields();
    } catch (err) {
      // A network failure (offline, unreachable) gets queued for background
      // replay - distinct from the server actively rejecting the review
      // (validation, duplicate, rate limit), which stays a hard error.
      if (!navigator.onLine || err instanceof TypeError) {
        try {
          await queueAction('review', reviewPayload);
          setQueued(true);
          resetFields();
        } catch {
          setError('Failed to save your review - please try again');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 border border-border rounded-lg bg-elimux-card text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500';

  return (
    <form onSubmit={handleSubmit} className="bg-elimux-dark rounded-lg border border-border p-6 mb-6">
      <h3 className="font-semibold text-lg text-foreground mb-4">Write a Review</h3>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-elimux-danger/10 text-elimux-danger text-sm">{error}</div>
      )}

      {queued && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-primary-600/10 text-primary-400 text-sm">
          You&apos;re offline — your review will be submitted automatically once you&apos;re back online.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-muted mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1"
            >
              <Star className={`w-6 h-6 ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input type="text" placeholder="Your name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} className={inputClass} />
        <input type="email" placeholder="Your email" value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} className={inputClass} />
      </div>

      <input type="text" placeholder="Review title" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mb-4`} required />

      <textarea placeholder="Share your experience..." value={content} onChange={(e) => setContent(e.target.value)} className={`${inputClass} mb-4 h-32`} required />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input type="text" placeholder="Pros (comma separated)" value={pros} onChange={(e) => setPros(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Cons (comma separated)" value={cons} onChange={(e) => setCons(e.target.value)} className={inputClass} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-muted mb-2">Would you recommend this?</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={`px-4 py-2 rounded-lg ${wouldRecommend === true ? 'bg-green-600 text-white' : 'bg-muted/10 text-foreground'}`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={`px-4 py-2 rounded-lg ${wouldRecommend === false ? 'bg-red-600 text-white' : 'bg-muted/10 text-foreground'}`}
          >
            No
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !rating || !title || !content}
        className="w-full bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-2 rounded-lg disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
