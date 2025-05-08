// src/hooks/useMCPResource.ts (updated)
import { useState, useEffect } from 'react';

export function useMCPResource<T = any>(serverId: string, resourceUri: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!serverId || !resourceUri) {
      return;
    }
    
    async function fetchResource() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/mcp/resource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverId,
            resourceUri,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load resource');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResource();
  }, [serverId, resourceUri]);
  
  return { data, isLoading, error };
}
