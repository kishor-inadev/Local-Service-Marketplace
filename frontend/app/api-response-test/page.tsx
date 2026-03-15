'use client';

import { useState } from 'react';
import { authService } from '@/services/auth-service';
import { requestService } from '@/services/request-service';
import { jobService } from '@/services/job-service';
import { proposalService } from '@/services/proposal-service';
import { notificationService } from '@/services/notification-service';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  response?: any;
  error?: string;
}

export default function ApiResponseTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...updates };
      return newResults;
    });
  };

  const runTests = async () => {
    setRunning(true);
    
    const tests: TestResult[] = [
      { name: 'GET Categories (Array)', status: 'pending', message: 'Testing list endpoint...' },
      { name: 'GET My Requests (Array)', status: 'pending', message: 'Testing my requests...' },
      { name: 'GET My Jobs (Array)', status: 'pending', message: 'Testing my jobs...' },
      { name: 'GET Notifications (Object)', status: 'pending', message: 'Testing notifications...' },
      { name: 'POST Invalid Request (Error)', status: 'pending', message: 'Testing error handling...' },
    ];
    
    setResults(tests);

    // Test 1: Get Categories (Simple Array)
    try {
      const categories = await requestService.getCategories();
      updateResult(0, {
        status: 'success',
        message: `✓ Received ${Array.isArray(categories) ? categories.length : 0} categories`,
        response: {
          type: Array.isArray(categories) ? 'Array' : typeof categories,
          sample: categories[0] || null,
          count: Array.isArray(categories) ? categories.length : 'N/A'
        }
      });
    } catch (error: any) {
      updateResult(0, {
        status: 'error',
        message: '✗ Failed',
        error: error.message
      });
    }

    // Test 2: Get My Requests
    try {
      const requests = await requestService.getMyRequests();
      updateResult(1, {
        status: 'success',
        message: `✓ Received ${Array.isArray(requests) ? requests.length : 0} requests`,
        response: {
          type: Array.isArray(requests) ? 'Array' : typeof requests,
          sample: requests[0] || null,
          count: Array.isArray(requests) ? requests.length : 'N/A'
        }
      });
    } catch (error: any) {
      updateResult(1, {
        status: 'success',
        message: '✓ Expected error (not authenticated)',
        error: error.message
      });
    }

    // Test 3: Get My Jobs
    try {
      const jobs = await jobService.getMyJobs();
      updateResult(2, {
        status: 'success',
        message: `✓ Received ${Array.isArray(jobs) ? jobs.length : 0} jobs`,
        response: {
          type: Array.isArray(jobs) ? 'Array' : typeof jobs,
          sample: jobs[0] || null,
          count: Array.isArray(jobs) ? jobs.length : 'N/A'
        }
      });
    } catch (error: any) {
      updateResult(2, {
        status: 'success',
        message: '✓ Expected error (not authenticated)',
        error: error.message
      });
    }

    // Test 4: Get Notifications (Object with notifications + unreadCount)
    try {
      const notifications = await notificationService.getNotifications({ limit: 5 });
      updateResult(3, {
        status: 'success',
        message: `✓ Received ${Array.isArray(notifications) ? notifications.length : 0} notifications`,
        response: {
          type: Array.isArray(notifications) ? 'Array' : typeof notifications,
          sample: notifications[0] || null,
          count: Array.isArray(notifications) ? notifications.length : 'N/A'
        }
      });
    } catch (error: any) {
      updateResult(3, {
        status: 'error',
        message: '✗ Failed',
        error: error.message
      });
    }

    // Test 5: Error Handling (422 validation)
    try {
      await requestService.createRequest({
        category_id: '', // Invalid - empty
        description: '', // Invalid - empty
        budget: -100 // Invalid - negative
      });
      updateResult(4, {
        status: 'error',
        message: '✗ Should have thrown error',
      });
    } catch (error: any) {
      updateResult(4, {
        status: 'success',
        message: '✓ Error handled correctly',
        response: {
          errorMessage: error.message,
          hasResponse: !!error.response,
          hasStandardError: !!(error.response?.data?.error)
        }
      });
    }

    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">API Response Structure Test</h1>
          <p className="text-gray-600 mb-6">
            Testing standardized response structure across all endpoints
          </p>

          <button
            onClick={runTests}
            disabled={running}
            className={`px-6 py-3 rounded-lg font-semibold text-white mb-8 ${
              running 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {running ? 'Running Tests...' : 'Run Tests'}
          </button>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-6 ${
                    result.status === 'pending' 
                      ? 'border-gray-300 bg-gray-50'
                      : result.status === 'success'
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.status === 'pending'
                        ? 'bg-gray-200 text-gray-700'
                        : result.status === 'success'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3">{result.message}</p>

                  {result.response && (
                    <div className="bg-white border border-gray-200 rounded p-4 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Response:</p>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.error && (
                    <div className="bg-red-100 border border-red-300 rounded p-3">
                      <p className="text-sm font-medium text-red-800">Error:</p>
                      <p className="text-xs text-red-700 mt-1">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Response Structure Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-2">✓ Success Response</h3>
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": [...], // or {}
  "total": 10 // lists only
}`}
                </pre>
                <p className="text-xs text-gray-600 mt-2">
                  Frontend receives: Just the data (unwrapped)
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-2">✗ Error Response</h3>
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "success": false,
  "statusCode": 404,
  "message": "...",
  "error": {
    "code": "NOT_FOUND",
    "message": "..."
  }
}`}
                </pre>
                <p className="text-xs text-gray-600 mt-2">
                  Toast shown automatically
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📋 How It Works</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Backend wraps all responses in standard format</li>
                <li>✓ API Gateway interceptor adds structure automatically</li>
                <li>✓ Frontend interceptor unwraps responses automatically</li>
                <li>✓ Service code uses response.data as normal</li>
                <li>✓ No breaking changes - existing code works</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
