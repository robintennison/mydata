import { useState, useEffect } from 'react';

interface FileSizeResult {
  size: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch file size from a URL
 * For Firebase Storage URLs, we attempt to get content-length via HEAD request
 */
export const useFileSize = (fileUrl: string | null): FileSizeResult => {
  const [result, setResult] = useState<FileSizeResult>({
    size: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!fileUrl) {
      setResult({ size: null, loading: false, error: null });
      return;
    }

    // For Firebase Storage URLs, we can try a HEAD request
    const fetchFileSize = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Try to get file size via HEAD request
        const response = await fetch(fileUrl, { method: 'HEAD' });
        
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            const size = parseInt(contentLength, 10);
            setResult({ size, loading: false, error: null });
            return;
          }
        }

        // If HEAD request fails or no content-length, we can't determine size
        setResult({ size: null, loading: false, error: 'Could not determine file size' });
      } catch (error) {
        console.error('Error fetching file size:', error);
        setResult({ 
          size: null, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    };

    fetchFileSize();
  }, [fileUrl]);

  return result;
};

/**
 * Alternative: Get file size from File object (for new uploads)
 */
export const getFileSizeFromFile = (file: File | null): number | null => {
  return file?.size || null;
};

/**
 * Format file size using existing helper
 * This re-exports formatFileSize from fileOptimizer for convenience
 */
export { formatFileSize } from './fileOptimizer';