import { ProviderDashboardLayout } from '@/components/layout/ProviderDashboardLayout';
import { PortfolioUpload } from '@/components/features/provider/PortfolioUpload';
import { PortfolioGallery } from '@/components/features/provider/PortfolioGallery';

export default function ProviderPortfolioPage({ params }: { params: { id: string } }) {
  return (
    <ProviderDashboardLayout providerId={params.id}>
      <div className="space-y-8">
        <PortfolioUpload 
          providerId={params.id}
          onUploadSuccess={() => window.location.reload()}
        />
        
        <PortfolioGallery providerId={params.id} />
      </div>
    </ProviderDashboardLayout>
  );
}
