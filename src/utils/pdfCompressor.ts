

// Helper function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Compress PDF using a simpler approach
 */
export const simplePDFCompress = async (pdfFile: File): Promise<File> => {
  try {
    console.log(`Simple PDF compression: ${pdfFile.name} (${formatFileSize(pdfFile.size)})`);
    
    const arrayBuffer = await pdfFile.arrayBuffer();
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Set metadata
    pdfDoc.setTitle(pdfFile.name.replace(/\.pdf$/i, ''));
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // Save with compression options
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    const compressedSize = compressedBytes.byteLength;
    const savedPercentage = ((pdfFile.size - compressedSize) / pdfFile.size) * 100;
    
    console.log(`Simple compression: ${formatFileSize(pdfFile.size)} → ${formatFileSize(compressedSize)} (${savedPercentage.toFixed(1)}% saved)`);
    
    // Convert Uint8Array to ArrayBuffer properly
    const compressedArrayBuffer = compressedBytes.buffer;
    
    // Create a new ArrayBuffer to avoid SharedArrayBuffer issues
    const safeArrayBuffer = new ArrayBuffer(compressedArrayBuffer.byteLength);
    const view = new Uint8Array(safeArrayBuffer);
    view.set(new Uint8Array(compressedArrayBuffer));
    
    return new File(
      [safeArrayBuffer],
      pdfFile.name,
      { type: 'application/pdf' }
    );
    
  } catch (error) {
    console.error('Simple PDF compression failed:', error);
    return pdfFile;
  }
};

/**
 * Alternative: More aggressive PDF compression
 */
export const aggressivePDFCompress = async (pdfFile: File): Promise<File> => {
  try {
    console.log(`Aggressive PDF compression: ${pdfFile.name} (${formatFileSize(pdfFile.size)})`);
    
    // Load the PDF
    const arrayBuffer = await pdfFile.arrayBuffer();
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Get pages to potentially reduce quality
    const pages = pdfDoc.getPages();
    console.log(`PDF has ${pages.length} pages`);
    
    // For each page, we could potentially reduce embedded image quality
    // but this requires more complex image extraction
    
    // Set metadata
    pdfDoc.setTitle(pdfFile.name.replace(/\.pdf$/i, ''));
    
    // Save with more aggressive options
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    
    const compressedSize = compressedBytes.byteLength;
    const savedPercentage = ((pdfFile.size - compressedSize) / pdfFile.size) * 100;
    
    console.log(`Aggressive compression: ${formatFileSize(pdfFile.size)} → ${formatFileSize(compressedSize)} (${savedPercentage.toFixed(1)}% saved)`);
    
    // Convert to safe ArrayBuffer
    const safeArrayBuffer = new ArrayBuffer(compressedBytes.byteLength);
    const view = new Uint8Array(safeArrayBuffer);
    view.set(compressedBytes);
    
    return new File(
      [safeArrayBuffer],
      `compressed_${pdfFile.name}`,
      { type: 'application/pdf' }
    );
    
  } catch (error) {
    console.error('Aggressive PDF compression failed:', error);
    return await simplePDFCompress(pdfFile); // Fallback to simple compression
  }
};

/**
 * Compresses a PDF file
 */
export const compressPDF = async (pdfFile: File): Promise<File> => {
  try {
    console.log(`Starting PDF compression: ${pdfFile.name} (${formatFileSize(pdfFile.size)})`);
    
    // Try aggressive compression first
    const aggressivelyCompressed = await aggressivePDFCompress(pdfFile);
    
    // If aggressive compression didn't help much, try simple
    const aggressiveSavings = ((pdfFile.size - aggressivelyCompressed.size) / pdfFile.size) * 100;
    
    if (aggressiveSavings < 5) { // Less than 5% savings
      console.log('Aggressive compression had minimal effect, trying simple compression');
      return await simplePDFCompress(pdfFile);
    }
    
    return aggressivelyCompressed;
    
  } catch (error) {
    console.error('Error compressing PDF:', error);
    // Return original file if compression fails
    return pdfFile;
  }
};

/**
 * Alternative: Convert PDF pages to compressed images (conceptual)
 */
export const convertPDFToCompressedImages = async (pdfFile: File): Promise<File[]> => {
  try {
    console.log(`Converting PDF to images: ${pdfFile.name}`);
    
    // This would require pdf.js or similar library
    // Implementation would involve:
    // 1. Using pdf.js to render each page to canvas
    // 2. Converting canvas to compressed image
    // 3. Creating image files
    
    console.log('PDF to image conversion requires additional setup');
    
    return [];
    
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    return [];
  }
};

/**
 * Optimize PDF for web viewing (reduces size for online display)
 */
export const optimizePDFForWeb = async (pdfFile: File): Promise<File> => {
  try {
    console.log(`Optimizing PDF for web: ${pdfFile.name}`);
    
    // This is a simplified version that just uses basic compression
    // For real web optimization, you'd want to:
    // 1. Linearize the PDF (fast web view)
    // 2. Remove unnecessary metadata
    // 3. Compress images more aggressively
    // 4. Possibly convert to PDF/A format
    
    const compressed = await simplePDFCompress(pdfFile);
    
    // Rename to indicate it's web-optimized
    const optimizedFile = new File(
      [await compressed.arrayBuffer()],
      `web_${pdfFile.name}`,
      { type: 'application/pdf' }
    );
    
    return optimizedFile;
    
  } catch (error) {
    console.error('Error optimizing PDF for web:', error);
    return pdfFile;
  }
};