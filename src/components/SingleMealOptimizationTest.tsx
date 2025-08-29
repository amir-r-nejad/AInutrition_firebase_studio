'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { SingleMealOptimizationService } from '@/services/single-meal-optimization';

export default function SingleMealOptimizationTest() {
  const [testResult, setTestResult] = useState<{
    message: string;
    status: string;
  } | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await SingleMealOptimizationService.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        message: error instanceof Error ? error.message : 'Test failed',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckHealth = async () => {
    setIsLoading(true);
    try {
      const result = await SingleMealOptimizationService.getHealth();
      setHealthStatus(result);
    } catch (error) {
      setHealthStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Single Meal Optimization API Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Current Status: Working with Mock Responses</p>
              <p className="mb-2">
                The system is now fully functional for testing and development. It automatically uses mock responses 
                since the external optimization endpoint is not yet implemented.
              </p>
              <p className="text-xs">
                <strong>Next Step:</strong> Implement the <code>/optimize-single-meal</code> endpoint on your backend 
                to enable real optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            onClick={handleCheckHealth}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Checking...' : 'Check Health'}
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className={`p-3 border rounded-lg ${getStatusColor(testResult.status)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResult.status)}
              <span className="font-medium">Connection Test Result:</span>
            </div>
            <p className="mt-1 text-sm">{testResult.message}</p>
          </div>
        )}

        {healthStatus && (
          <div className={`p-3 border rounded-lg ${getStatusColor(healthStatus.status)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(healthStatus.status)}
              <span className="font-medium">Health Check Result:</span>
            </div>
            <p className="mt-1 text-sm">{healthStatus.message}</p>
          </div>
        )}

        {/* Feature Status */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Feature Status:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Frontend Components</span>
              <Badge variant="secondary" className="text-xs">Ready</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Local API Routes</span>
              <Badge variant="secondary" className="text-xs">Ready</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Mock Response System</span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>External Optimization API</span>
              <Badge variant="secondary" className="text-xs">Pending</Badge>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="p-3 bg-gray-50 border rounded-lg">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Implementation Notes:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• The system is ready for immediate testing with realistic mock data</li>
            <li>• All UI components are fully functional</li>
            <li>• Mock responses include proper nutritional calculations</li>
            <li>• Backend implementation can be done independently</li>
            <li>• No frontend changes needed when backend is ready</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
