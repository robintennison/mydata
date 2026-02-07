import imageCompression from 'browser-image-compression';
import { simplePDFCompress } from './pdfCompressor';

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
 * Calculates file size in readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
 * Optimizes an image file before upload
 */
export const optimizeImage = async (
  file: File,
  customOptions?: Partial<OptimizationOptions>
): Promise<File> => {
  try {
    console.log(`Starting image optimization for: ${file.name} (${formatFileSize(file.size)})`);
    
    const options = {
      ...defaultOptions.image,
      ...customOptions,
      fileType: file.type,
    };

    // Convert HEIC/HEIF files to JPEG if needed
    let processedFile = file;
    if (file.type.includes('heic') || file.type.includes('heif')) {
      console.log('Converting HEIC/HEIF to JPEG...');
      processedFile = await convertHeicToJpeg(file);
    }

    // Compress the image
    console.log('Compressing image...');
    const compressedFile = await imageCompression(processedFile, options);

    // Check if compression was effective
    if (compressedFile.size < file.size) {
      console.log(
        `Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} (${((file.size - compressedFile.size) / file.size * 100).toFixed(1)}% saved)`
      );
      return compressedFile;
    }

    console.log('Image compression had no effect, returning original file');
    return file;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original file if optimization fails
    return file;
  }
};

/**
 * Optimizes a PDF file (basic implementation)
 */
export const optimizePdf = async (file: File): Promise<File> => {
  try {
    console.log(`Starting PDF optimization for: ${file.name} (${formatFileSize(file.size)})`);
    
    // For now, we can't optimize PDFs in the browser without a proper library
    // You might want to add pdf-lib or similar for actual PDF optimization
    console.log('PDF optimization not implemented yet. Returning original file.');
    
    // TODO: Implement PDF optimization using pdf-lib
    // This would require:
    // 1. Extracting images from PDF
    // 2. Compressing images
    // 3. Rebuilding PDF with compressed images
    
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
    console.log(`Processing document: ${file.name} (${formatFileSize(file.size)})`);
    
    // For non-image documents, we can't do much optimization in the browser
    // Could implement text compression or other techniques here
    console.log('Document optimization not available. Returning original file.');
    
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
  const fileName = file.name.toLowerCase();
  
  console.log(`Processing file: ${file.name}, Type: ${fileType}, Size: ${formatFileSize(file.size)}`);
  
  // Check file size first - don't process files that are already small
  if (file.size < 100 * 1024) { // Less than 100KB
    console.log('File is already small, skipping optimization');
    return file;
  }

  if (fileType.startsWith('image/')) {
    console.log('Detected as image file, optimizing...');
    return optimizeImage(file);
  } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    console.log('Detected as PDF file, attempting compression...');
    
    // Try simple PDF compression first
    try {
      const compressedPDF = await simplePDFCompress(file);
      
      // Only return compressed version if it's actually smaller
      if (compressedPDF.size < file.size) {
        const savings = ((file.size - compressedPDF.size) / file.size) * 100;
        console.log(`PDF compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedPDF.size)} (${savings.toFixed(1)}% saved)`);
        return compressedPDF;
      } else {
        console.log('PDF compression had no effect, returning original');
        return file;
      }
    } catch (error) {
      console.error('PDF compression failed, returning original:', error);
      return file;
    }
  } else {
    console.log('Detected as other document type...');
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
): { valid: boolean; error: string } => {
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
      error: `File type "${file.type}" not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large (${formatFileSize(file.size)}). Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true, error: "" };
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