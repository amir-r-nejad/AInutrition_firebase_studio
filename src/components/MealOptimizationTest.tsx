'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const MealOptimizationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection?: { success: boolean; message: string; details?: any; isFallback?: boolean };
  }>({});

  const testConnectionAPI = async () => {
    setIsLoading(true);
    setTestResults({});
    
    try {
      console.log('Testing connection to external API...');
      
      // Test our local API proxy first
      const response = await fetch('/api/test-meal-optimization');
      const result = await response.json();
      
      console.log('Test API response:', result);
      
      const isFallback = !result.success;
      
      setTestResults({
        connection: {
          success: result.success,
          message: result.message,
          details: result,
          isFallback
        }
      });
      
      if (result.success) {
        console.log('✅ External API connection successful');
      } else {
        console.log('❌ External API connection failed:', result.message);
        console.log('🔄 Fallback service will be used');
      }
    } catch (err) {
      console.error('Test failed:', err);
      setTestResults({
        connection: {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error occurred',
          details: { error: err },
          isFallback: true
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Meal Optimization API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={testConnectionAPI} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test External API Connection'
            )}
          </Button>
          
          {testResults.connection && (
            <div className={`flex items-start gap-2 p-3 rounded ${
              testResults.connection.success ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'
            }`}>
              {testResults.connection.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{testResults.connection.message}</p>
                {testResults.connection.isFallback && (
                  <div className="mt-2 p-2 bg-orange-100 rounded text-sm">
                    <p className="font-medium text-orange-800">Fallback Service Available</p>
                    <p className="text-orange-700 text-xs mt-1">
                      Your meal optimization will still work using our local algorithms
                    </p>
                  </div>
                )}
                {testResults.connection.details && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer hover:underline">View Details</summary>
                    <pre className="mt-2 p-2 bg-black/10 rounded text-xs overflow-auto">
                      {JSON.stringify(testResults.connection.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">What this test does:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Tests connection to the external Meal Optimization API</li>
                <li>Uses our local Next.js API route to avoid CORS issues</li>
                <li>Shows detailed error information if connection fails</li>
                <li>Indicates when fallback service will be used</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">Current Status:</p>
              <p className="mt-1">
                The external Meal Optimization API appears to be down (502 Bad Gateway). 
                However, our system includes a fallback service that will provide meal optimization 
                using local algorithms, so you can still get meal plans and recommendations.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
