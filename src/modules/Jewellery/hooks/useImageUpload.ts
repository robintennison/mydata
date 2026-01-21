import { useState } from "react";

interface ImageUploadHook {
  compressedImage: string | null;
  compressedFile: File | null;
  isCompressing: boolean;
  uploadImage: (file: File) => Promise<void>;
  clearImage: () => void;
}

export const useImageUpload = (): ImageUploadHook => {
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = async (file: File): Promise<{ dataUrl: string; file: File }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Calculate new dimensions (max 800px)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to data URL with reduced quality (70% quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                resolve({ dataUrl, file: compressedFile });
              } else {
                reject(new Error("Failed to compress image"));
              }
            },
            "image/jpeg",
            0.7
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File) => {
    setIsCompressing(true);
    try {
      const { dataUrl, file: compressed } = await compressImage(file);
      setCompressedImage(dataUrl);
      setCompressedFile(compressed);
      
      // Log compression stats
      const originalSize = file.size;
      const compressedSize = compressed.size;
      const reduction = ((originalSize - compressedSize) / originalSize) * 100;
      console.log(`Image compressed: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${reduction.toFixed(1)}% reduction)`);
    } catch (error) {
      console.error("Error compressing image:", error);
      // Fallback to original file
      const dataUrl = URL.createObjectURL(file);
      setCompressedImage(dataUrl);
      setCompressedFile(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const clearImage = () => {
    if (compressedImage && compressedImage.startsWith("blob:")) {
      URL.revokeObjectURL(compressedImage);
    }
    setCompressedImage(null);
    setCompressedFile(null);
  };

  return {
    compressedImage,
    compressedFile,
    isCompressing,
    uploadImage,
    clearImage,
  };
};