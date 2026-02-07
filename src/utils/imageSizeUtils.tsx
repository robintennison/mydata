import React from "react";
import { getStorage, ref, getMetadata } from "firebase/storage";
import { formatFileSize } from "./fileOptimizer";

export interface ImageSizeInfo {
  size: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches image size from Firebase Storage URL
 */
export const fetchImageSizeFromUrl = async (
  imageUrl: string,
): Promise<number | null> => {
  if (!imageUrl) return null;

  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);

    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1]);
      const storage = getStorage();
      const storageRef = ref(storage, filePath);

      // Get metadata including file size
      const metadata = await getMetadata(storageRef);
      return metadata.size;
    }
  } catch (error) {
    console.error("Error fetching image size:", error);
  }

  return null;
};

/**
 * React hook for managing image size state
 */
export const useImageSize = (imageUrl: string | null) => {
  const [sizeInfo, setSizeInfo] = React.useState<ImageSizeInfo>({
    size: null,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    const fetchSize = async () => {
      if (!imageUrl) {
        setSizeInfo({ size: null, loading: false, error: null });
        return;
      }

      try {
        setSizeInfo((prev) => ({ ...prev, loading: true, error: null }));
        const size = await fetchImageSizeFromUrl(imageUrl);
        setSizeInfo({ size, loading: false, error: null });
      } catch (error: any) {
        setSizeInfo({
          size: null,
          loading: false,
          error: error.message || "Failed to load image size",
        });
      }
    };

    fetchSize();
  }, [imageUrl]);

  return sizeInfo;
};

/**
 * Component to display image size badge
 */
export const ImageSizeBadge: React.FC<{
  size: number | null;
  loading?: boolean;
  error?: string | null;
  position?: "overlay" | "below";
  className?: string;
}> = ({
  size,
  loading = false,
  error = null,
  position = "overlay",
  className = "",
}) => {
  if (loading) {
    return (
      <div
        className={`
          ${
            position === "overlay"
              ? "absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
              : "inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
          }
          ${className}
        `}
      >
        <span className="animate-pulse">📏</span>
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`
          ${
            position === "overlay"
              ? "absolute bottom-2 left-2 bg-red-600/90 text-white text-xs px-2 py-1 rounded"
              : "inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-3 py-1.5 rounded-full"
          }
          ${className}
        `}
        title={error}
      >
        <span>⚠️</span>
        <span>Error</span>
      </div>
    );
  }

  if (size === null) {
    return null;
  }

  return (
    <div
      className={`
        ${
          position === "overlay"
            ? "absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
            : "inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
        }
        ${className}
      `}
      title={`File size: ${formatFileSize(size)}`}
    >
      <span>📏</span>
      <span className="font-medium">{formatFileSize(size)}</span>
    </div>
  );
};
