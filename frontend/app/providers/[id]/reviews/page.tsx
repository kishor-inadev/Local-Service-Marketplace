import { ProviderDashboardLayout } from '@/components/layout/ProviderDashboardLayout';
import { ReviewAggregates } from '@/components/features/review/ReviewAggregates';

export default function ProviderReviewsPage({ params }: { params: { id: string } }) {
  return (
    <ProviderDashboardLayout providerId={params.id}>
      <ReviewAggregates providerId={params.id} />
    </ProviderDashboardLayout>
  );
}
