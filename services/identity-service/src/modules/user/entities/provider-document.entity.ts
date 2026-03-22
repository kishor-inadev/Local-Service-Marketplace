export class ProviderDocument {
  id: string;
  provider_id: string;
  document_type: 'government_id' | 'business_license' | 'insurance_certificate' | 'certification' | 'tax_document';
  document_url: string;
  document_name: string;
  document_number?: string;
  verified: boolean;
  rejected: boolean;
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: Date;
  expires_at?: Date;
  created_at: Date;
}
