import { ProviderDashboardLayout } from '@/components/layout/ProviderDashboardLayout';
import { DocumentUpload } from '@/components/features/provider/DocumentUpload';
import { DocumentList } from '@/components/features/provider/DocumentList';

export default function ProviderDocumentsPage({ params }: { params: { id: string } }) {
  return (
    <ProviderDashboardLayout providerId={params.id}>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <DocumentUpload 
            providerId={params.id}
            onUploadSuccess={() => window.location.reload()}
          />
        </div>
        
        <div>
          <DocumentList providerId={params.id} />
        </div>
      </div>
    </ProviderDashboardLayout>
  );
}
