'use client';

import { useState, useEffect } from 'react';
import {
  getProviderDocuments,
  getDocumentVerificationStatus,
  deleteProviderDocument,
  type ProviderDocument,
  type VerificationStatus
} from '@/services/user-service';
import { FileText, Check, X, Clock, AlertTriangle, Calendar, Eye } from 'lucide-react';

export function DocumentList({ providerId }: { providerId?: string }) {
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ProviderDocument | null>(null);

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      return;
    }
    loadDocuments();
    loadVerificationStatus();
  }, [providerId]);

  const loadDocuments = async () => {
    if (!providerId) return;
    try {
      const data = await getProviderDocuments(providerId);
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationStatus = async () => {
    if (!providerId) return;
    try {
      const data = await getDocumentVerificationStatus(providerId);
      setStatus(data);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!providerId) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteProviderDocument(providerId, documentId);
      loadDocuments();
      loadVerificationStatus();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const getStatusBadge = (doc: ProviderDocument) => {
    if (doc.verified) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
          <Check className="w-4 h-4" />
          Verified
        </span>
      );
    }

    if (doc.rejected && doc.rejection_reason) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-sm font-medium rounded-full">
          <X className="w-4 h-4" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-full">
        <Clock className="w-4 h-4" />
        Pending Review
      </span>
    );
  };

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isExpiring = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Status Card */}
      {status && (
        <div className={`p-6 rounded-lg border-2 ${status.fully_verified
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
          }`}>
          <div className="flex items-start gap-4">
            {status.fully_verified ? (
              <Check className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                {status.fully_verified ? 'Fully Verified' : 'Verification Incomplete'}
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Verified Documents</p>
                  <p className="text-2xl font-bold text-green-600">{status.verified_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{status.pending_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">Missing Required</p>
                  <p className="text-2xl font-bold text-red-600">
                    {status.missing_required_count}
                  </p>
                </div>
              </div>

              {status.missing_required_documents && status.missing_required_documents.length > 0 && (
                <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                  <p className="font-medium text-sm mb-2">Missing Required Documents:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {status.missing_required_documents.map((docType: string) => (
                      <li key={docType}>{formatDocumentType(docType)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Uploaded Documents</h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No documents uploaded yet</p>
            <p className="text-sm mt-2">Upload your verification documents to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map(doc => (
              <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {formatDocumentType(doc.document_type)}
                        </h4>
                        {getStatusBadge(doc)}
                      </div>

                      {doc.document_number && (
                        <p className="text-sm text-gray-600 mb-1">
                          Document #: {doc.document_number}
                        </p>
                      )}

                      {doc.expiry_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span className={`${isExpired(doc.expiry_date)
                              ? 'text-red-600 font-medium'
                              : isExpiring(doc.expiry_date)
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-600'
                            }`}>
                            {isExpired(doc.expiry_date) && 'Expired: '}
                            {isExpiring(doc.expiry_date) && !isExpired(doc.expiry_date) && 'Expires: '}
                            {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {doc.verified_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Verified on {new Date(doc.verified_at).toLocaleDateString()}
                        </p>
                      )}

                      {doc.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-900 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-800">{doc.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Document"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {!doc.verified && (
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Document"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">
                {formatDocumentType(selectedDocument.document_type)}
              </h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <iframe
                src={selectedDocument.document_url}
                className="w-full h-[600px] border border-gray-300 rounded"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
