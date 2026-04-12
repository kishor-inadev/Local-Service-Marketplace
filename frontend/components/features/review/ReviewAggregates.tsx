'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Award } from 'lucide-react';
import reviewService, { type ReviewAggregate } from '@/services/review-service';

export function ReviewAggregates({ providerId }: { providerId: string }) {
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAggregate = useCallback(async () => {
    try {
      const data = await reviewService.getProviderReviewAggregates(providerId);
      setAggregate(data || null);
    } catch (error) {
      console.error('Failed to load review aggregates:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadAggregate();
  }, [providerId, loadAggregate]);

  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  const isTrustedPro = () => {
    if (!aggregate) return false;
    return aggregate.total_reviews >= 10 && aggregate.average_rating >= 4.0;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : i < rating
            ? 'text-yellow-400 fill-yellow-400 opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!aggregate || aggregate.total_reviews === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">
          This provider hasn't received any reviews yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Stats Card */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Customer Reviews
            </h2>
            <p className="text-gray-600">
              Based on {aggregate.total_reviews} {aggregate.total_reviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {isTrustedPro() && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              <Award className="w-5 h-5" />
              <span className="font-semibold">Trusted Pro</span>
            </div>
          )}
        </div>

        {/* Average Rating */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-bold text-gray-900">
                {aggregate.average_rating.toFixed(1)}
              </span>
              <span className="text-2xl text-gray-600">/ 5.0</span>
            </div>
            <div className="flex justify-center md:justify-start mb-2">
              {renderStars(aggregate.average_rating)}
            </div>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = 
              stars === 5 ? aggregate.five_star_count :
              stars === 4 ? aggregate.four_star_count :
              stars === 3 ? aggregate.three_star_count :
              stars === 2 ? aggregate.two_star_count :
              aggregate.one_star_count;
            
            const percentage = getRatingPercentage(count, aggregate.total_reviews);

            return (
              <div key={stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-24">
                  <span className="text-sm font-medium text-gray-700">{stars}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stars >= 4 ? 'bg-green-500' :
                      stars === 3 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <span className="text-sm text-gray-600 w-16 text-right">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>

        {/* Last Review */}
        {aggregate.last_review_at && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
            Last reviewed {new Date(aggregate.last_review_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Trust Badge Info */}
      {isTrustedPro() ? (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Award className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Trusted Pro Status</h4>
              <p className="text-sm text-blue-800">
                This provider has earned the Trusted Pro badge by maintaining an average rating of 
                {aggregate.average_rating.toFixed(1)} stars with {aggregate.total_reviews} verified reviews.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Award className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Earn Trusted Pro Status</h4>
              <p className="text-sm text-gray-600">
                Get at least 10 reviews with an average rating of 4.0 or higher to earn the Trusted Pro badge 
                and stand out to potential customers.
              </p>
              <div className="mt-3 flex gap-4 text-sm">
                <span className={aggregate.total_reviews >= 10 ? 'text-green-600' : 'text-gray-600'}>
                  ✓ {aggregate.total_reviews}/10 reviews
                </span>
                <span className={aggregate.average_rating >= 4.0 ? 'text-green-600' : 'text-gray-600'}>
                  ✓ {aggregate.average_rating.toFixed(1)}/4.0 rating
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
