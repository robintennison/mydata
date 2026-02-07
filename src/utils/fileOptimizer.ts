import imageCompression from 'browser-image-compression';

// Interface for optimization options
interface OptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  quality?: number;
}

// Default optimization options for different file types
const defaultOptions: Record<string, OptimizationOptions> = {
  image: {
    maxSizeMB: 1, // Max 1MB for images
    maxWidthOrHeight: 1024, // Max dimension 1024px
    useWebWorker: true,
    quality: 0.8, // 80% quality
  },
  pdf: {
    maxSizeMB: 5, // Max 5MB for PDFs
  },
  document: {
    maxSizeMB: 2, // Max 2MB for other documents
  },
};

/**
 * Optimizes an image file before upload
 */
export const optimizeImage = async (
  file: File,
  customOptions?: Partial<OptimizationOptions>
): Promise<File> => {
  try {
    const options = {
      ...defaultOptions.image,
      ...customOptions,
      fileType: file.type,
    };

    // Convert HEIC/HEIF files to JPEG if needed
    let processedFile = file;
    if (file.type.includes('heic') || file.type.includes('heif')) {
      processedFile = await convertHeicToJpeg(file);
    }

    // Compress the image
    const compressedFile = await imageCompression(processedFile, options);

    // Check if compression was effective
    if (compressedFile.size < file.size) {
      console.log(
        `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
      );
      return compressedFile;
    }

    return file;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original file if optimization fails
    return file;
  }
};

/**
 * Converts HEIC/HEIF files to JPEG
 */
const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    // Check if heic2any is available
    if (typeof window !== 'undefined' && (window as any).heic2any) {
      const heic2any = (window as any).heic2any;
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8,
      });
      
      return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    }
    
    // If heic2any is not available, return original file
    console.warn('HEIC conversion library not loaded');
    return file;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    return file;
  }
};

/**
 * Optimizes a PDF file (basic implementation - reduces quality of embedded images)
 */
export const optimizePdf = async (file: File): Promise<File> => {
  try {
    // For now, return original PDF
    // TODO: Implement PDF optimization using pdf-lib
    console.log('PDF optimization would be implemented here');
    return file;
  } catch (error) {
    console.error('Error optimizing PDF:', error);
    return file;
  }
};

/**
 * Optimizes a document file (generic optimization)
 */
export const optimizeDocument = async (file: File): Promise<File> => {
  try {
    // For non-image documents, we can't do much optimization
    // Could implement text compression or other techniques here
    return file;
  } catch (error) {
    console.error('Error optimizing document:', error);
    return file;
  }
};

/**
 * Main function to optimize any file based on its type
 */
export const optimizeFile = async (file: File): Promise<File> => {
  const fileType = file.type.toLowerCase();
  
  // Check file size first - don't process files that are already small
  if (file.size < 100 * 1024) { // Less than 100KB
    console.log('File is already small, skipping optimization');
    return file;
  }

  if (fileType.startsWith('image/')) {
    return optimizeImage(file);
  } else if (fileType === 'application/pdf') {
    return optimizePdf(file);
  } else {
    return optimizeDocument(file);
  }
};

/**
 * Validates file before optimization
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  // Check file type
  const isValidType = allowedTypes.some(type => {
    if (type.includes('*')) {
      return file.type.startsWith(type.replace('*', ''));
    }
    return file.type === type;
  });

  if (!isValidType) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Generates a thumbnail for an image file
 */
export const generateThumbnail = async (
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> => {
  try {
    const options = {
      maxSizeMB: 0.1, // Thumbnail should be very small
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      quality: 0.6,
    };

    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    // Fallback to original file
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Calculates file size in readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};