'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// Import all API services
import { authService } from '@/services/auth-service';
import { getUserProfile, getProviders } from '@/services/user-service';
import { requestService } from '@/services/request-service';
import { proposalService } from '@/services/proposal-service';
import { jobService } from '@/services/job-service';
import { messageService } from '@/services/message-service';
import { notificationService } from '@/services/notification-service';
import { paymentService } from '@/services/payment-service';
import { createReview } from '@/services/review-service';
import { adminService } from '@/services/admin-service';

interface TestResult {
  service: string;
  method: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  response?: any;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (service: string, method: string, status: 'success' | 'error', message?: string, response?: any) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.service === service && r.method === method);
      const newResult = { service, method, status, message, response };
      
      if (existing >= 0) {
        const newResults = [...prev];
        newResults[existing] = newResult;
        return newResults;
      }
      return [...prev, newResult];
    });
  };

  const testEndpoint = async (service: string, method: string, fn: () => Promise<any>) => {
    try {
      const response = await fn();
      updateResult(service, method, 'success', 'OK', response);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      updateResult(service, method, 'error', `${statusCode || 'ERROR'}: ${message}`, error.response?.data);
      return false;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    toast.loading('Testing API endpoints...');

    // Note: Many of these will fail with 401 Unauthorized if not logged in
    // or 404 Not Found if resources don't exist - this is expected
    
    // Auth Service Tests (will fail if not logged in)
    await testEndpoint('auth', 'getProfile', () => authService.getProfile());
    
    // User Service Tests  
    await testEndpoint('user', 'getUserProfile', () => getUserProfile());
    await testEndpoint('user', 'getProviders', () => getProviders({ limit: 5 }));
    await testEndpoint('user', 'searchProviders', () => getProviders({ search: 'test', limit: 5 }));
    
    // Request Service Tests
    await testEndpoint('request', 'getRequests', () => requestService.getRequests({ limit: 5 }));
    await testEndpoint('request', 'getCategories', () => requestService.getCategories());
    
    // Proposal Service Tests
    await testEndpoint('proposal', 'getMyProposals', () => proposalService.getMyProposals());
    
    // Job Service Tests
    await testEndpoint('job', 'getMyJobs', () => jobService.getMyJobs());
    
    // Message Service Tests
    await testEndpoint('message', 'getConversations', () => messageService.getConversations());
    
    // Notification Service Tests
    await testEndpoint('notification', 'getNotifications', () => notificationService.getNotifications({ limit: 5 }));
    await testEndpoint('notification', 'getUnreadCount', () => notificationService.getUnreadCount());
    
    // Payment Service Tests
    await testEndpoint('payment', 'getMyPayments', () => paymentService.getMyPayments());
    
    // Review Service Tests (will fail without valid data)
    // Skip this for now as it requires a valid provider and job ID
    
    // Admin Service Tests (will fail if not admin)
    await testEndpoint('admin', 'getSystemStats', () => adminService.getSystemStats());

    setTesting(false);
    toast.dismiss();
    toast.success('API testing completed');
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Endpoint Testing</h1>
            <p className="text-gray-600 mt-2">
              Test all backend API endpoints to verify integration
            </p>
          </div>
          <Button
            onClick={runAllTests}
            disabled={testing}
            className="min-w-[150px]"
          >
            {testing ? 'Testing...' : 'Run All Tests'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Test Results</h2>
            <p className="text-sm text-gray-600">
              {results.length === 0 
                ? 'Click "Run All Tests" to start testing API endpoints'
                : `Tested ${results.length} endpoints`}
            </p>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tests run yet
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={`${result.service}-${result.method}-${index}`}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-semibold">
                            {result.service}.{result.method}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(result.status)}`}>
                            {result.status.toUpperCase()}
                          </span>
                        </div>
                        
                        {result.message && (
                          <p className={`mt-2 text-sm ${getStatusColor(result.status)}`}>
                            {result.message}
                          </p>
                        )}
                        
                        {result.response && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                              View Response
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <h3 className="font-semibold text-yellow-800">Expected Results</h3>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800 space-y-2">
            <p>• Some endpoints will return 401 (Unauthorized) if you're not logged in - this is expected</p>
            <p>• Some endpoints will return 404 (Not Found) if resources don't exist - this is expected</p>
            <p>• Any 500 (Server Error) or network errors indicate backend issues</p>
            <p>• Success (200) responses indicate the endpoint is working correctly</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
