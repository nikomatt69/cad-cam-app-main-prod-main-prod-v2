import { useState } from 'react';

export function useMCPTool<T = any, P = Record<string, any>>(serverId: string, toolName: string) {
  const [result, setResult] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = async (parameters: P) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mcp/tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          toolName,
          parameters,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute tool');
      }
      
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { execute, result, isLoading, error };
}