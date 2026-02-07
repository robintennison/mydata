// components/ImageUploadWithSize.tsx
import React, { useState } from "react";
import { ImageSizeBadge, useImageSize } from "../utils/imageSizeUtils";
import { formatFileSize } from "../utils/fileOptimizer";

interface ImageUploadWithSizeProps {
  imageUrl: string | null;
  onFileChange?: (file: File) => void;
  onDelete?: () => void;
  onRemove?: () => void;
  optimizationInfo?: {
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
    fileName: string;
  } | null;
  error?: string;
  disabled?: boolean;
  label?: string;
  imageNumber?: number;
  isViewMode?: boolean;
}

export const ImageUploadWithSize: React.FC<ImageUploadWithSizeProps> = ({
  imageUrl,
  onFileChange,
  onDelete,
  onRemove,
  optimizationInfo,
  error,
  disabled = false,
  label = "Image",
  isViewMode = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { size, loading, error: sizeError } = useImageSize(imageUrl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileChange) {
      setSelectedFile(file);
      onFileChange(file);
    }
  };

  const handleRemoveClick = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const hasExistingImage = !!imageUrl && !selectedFile;
  const hasNewFile = !!selectedFile;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {isViewMode ? (
        <div className="text-center relative">
          {imageUrl ? (
            <div className="inline-block relative">
              <img
                src={imageUrl}
                alt={label}
                className="max-w-full max-h-48 rounded-lg border border-gray-300 mx-auto"
              />
              <ImageSizeBadge
                size={size}
                loading={loading}
                error={sizeError}
                position="overlay"
              />
            </div>
          ) : (
            <div className="p-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm text-center">
              No image
            </div>
          )}
        </div>
      ) : (
        <>
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          />

          {/* Error message */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Optimization info */}
          {optimizationInfo && optimizationInfo.savedPercentage > 0 && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col text-green-800 text-xs">
                <div className="flex items-center gap-1 font-medium mb-1">
                  <span>🎯</span>
                  <span>
                    {optimizationInfo.savedPercentage.toFixed(1)}% space saved
                  </span>
                </div>
                <div className="font-mono text-xs">
                  {formatFileSize(optimizationInfo.originalSize)} →{" "}
                  {formatFileSize(optimizationInfo.optimizedSize)}
                </div>
              </div>
            </div>
          )}

          {/* Image previews */}
          <div className="space-y-3">
            {/* Existing image preview */}
            {hasExistingImage && (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={`Current ${label}`}
                  className="max-w-full max-h-36 rounded-lg border border-gray-300"
                />
                <ImageSizeBadge
                  size={size}
                  loading={loading}
                  error={sizeError}
                  position="overlay"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={disabled}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete Image
                  </button>
                </div>
              </div>
            )}

            {/* New image preview */}
            {hasNewFile && (
              <div className="relative">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt={`New ${label}`}
                  className="max-w-full max-h-36 rounded-lg border border-gray-300"
                />
                {/* Size badge for new file */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  <span className="font-medium">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveClick}
                    disabled={disabled}
                    className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Size badge below image */}
          {hasExistingImage && (
            <div className="text-center">
              <ImageSizeBadge
                size={size}
                loading={loading}
                error={sizeError}
                position="below"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
