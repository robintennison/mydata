import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, database } from "../lib/firebase";
import { ref as dbRef, set, push } from "firebase/database";
import {
  optimizeFile,
  validateFile,
  formatFileSize,
} from "../utils/fileOptimizer";

interface FileUploadProps {
  userId: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
  pathPrefix?: string;
  onUploadComplete?: (fileInfo: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  userId,
  allowedTypes = ["image/*", "application/pdf", "text/plain"],
  maxSizeMB = 10,
  pathPrefix = "users",
  onUploadComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [optimizedFile, setOptimizedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const selectedFile = e.target.files[0];

    // Validate file
    const validation = validateFile(selectedFile, allowedTypes, maxSizeMB);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      setFile(null);
      setOptimizedFile(null);
      setOptimizationInfo(null);
      return;
    }

    setFile(selectedFile);
    setError("");

    try {
      // Optimize the file
      setOptimizationInfo(null);
      const optimized = await optimizeFile(selectedFile);
      setOptimizedFile(optimized);

      // Calculate savings
      const originalSize = selectedFile.size;
      const optimizedSize = optimized.size;
      const savedPercentage =
        ((originalSize - optimizedSize) / originalSize) * 100;

      setOptimizationInfo({
        originalSize,
        optimizedSize,
        savedPercentage,
      });

      console.log(
        `File optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${savedPercentage.toFixed(1)}% saved)`,
      );
    } catch (err: any) {
      console.error("Error optimizing file:", err);
      setOptimizedFile(selectedFile); // Fallback to original
      setOptimizationInfo(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setError("Please select a file");
      return;
    }

    const fileToUpload = optimizedFile || file;

    setUploading(true);
    setError("");

    try {
      // Create a storage reference
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = fileToUpload.name.split(".").pop();
      const fileName = `${timestamp}_${randomId}.${fileExtension}`;

      const storageRef = ref(storage, `${pathPrefix}/${userId}/${fileName}`);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          setError(`Upload failed: ${error.message}`);
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save file info to Realtime Database
          const filesRef = dbRef(database, `${pathPrefix}/${userId}/files`);
          const newFileRef = push(filesRef);

          const fileInfo = {
            name: file.name,
            originalName: file.name,
            optimizedName: fileName,
            url: downloadURL,
            originalSize: file.size,
            optimizedSize: fileToUpload.size,
            type: file.type,
            uploadedAt: Date.now(),
            savedBytes: file.size - fileToUpload.size,
            savedPercentage: optimizationInfo?.savedPercentage || 0,
          };

          await set(newFileRef, fileInfo);

          setUploadedFiles((prev) => [...prev, file.name]);
          setFile(null);
          setOptimizedFile(null);
          setOptimizationInfo(null);
          setProgress(0);
          setUploading(false);

          // Call callback if provided
          if (onUploadComplete) {
            onUploadComplete(fileInfo);
          }

          // Reset file input
          const fileInput = document.getElementById(
            "file-input",
          ) as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        },
      );
    } catch (err: any) {
      setError(`Upload error: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📁 Upload Files to Firebase Storage</h3>
      <p style={styles.subtitle}>
        Files will be automatically optimized to save space
      </p>

      <div style={styles.uploadArea}>
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          style={styles.fileInput}
        />

        {file && (
          <div style={styles.fileInfo}>
            <div style={styles.fileRow}>
              <span style={styles.fileName}>📄 {file.name}</span>
              <span style={styles.fileSize}>{formatFileSize(file.size)}</span>
            </div>

            {optimizationInfo && optimizationInfo.savedPercentage > 0 && (
              <div style={styles.optimizationInfo}>
                <div style={styles.savingsBadge}>
                  🎯 {optimizationInfo.savedPercentage.toFixed(1)}% saved
                </div>
                <div style={styles.sizeComparison}>
                  {formatFileSize(optimizationInfo.originalSize)} →{" "}
                  {formatFileSize(optimizationInfo.optimizedSize)}
                </div>
              </div>
            )}

            {optimizationInfo && optimizationInfo.savedPercentage === 0 && (
              <div style={styles.noSavings}>File is already optimized</div>
            )}
          </div>
        )}

        {uploading && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            <span style={styles.progressText}>{progress.toFixed(1)}%</span>
          </div>
        )}

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            ...styles.uploadButton,
            opacity: !file || uploading ? 0.6 : 1,
            cursor: !file || uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload Optimized File"}
        </button>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={styles.uploadedFiles}>
          <h4>✅ Recently Uploaded:</h4>
          <ul style={styles.fileList}>
            {uploadedFiles.map((filename, index) => (
              <li key={index} style={styles.fileItem}>
                📄 {filename}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.infoBox}>
        <p>
          <strong>Storage Path:</strong> {pathPrefix}/{userId}/
        </p>
        <p>
          <strong>File Optimization:</strong> Automatic size reduction
        </p>
        <p style={styles.note}>
          Images are compressed, HEIC files are converted to JPEG
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    marginBottom: "30px",
  },
  title: {
    marginTop: 0,
    color: "#333",
  },
  subtitle: {
    color: "#666",
    marginBottom: "25px",
  },
  uploadArea: {
    border: "2px dashed #4285f4",
    borderRadius: "10px",
    padding: "30px",
    textAlign: "center" as const,
    backgroundColor: "#f8f9fa",
    marginBottom: "20px",
  },
  fileInput: {
    display: "block",
    margin: "0 auto 20px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    maxWidth: "400px",
  },
  fileInfo: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  fileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  fileName: {
    fontWeight: "bold" as const,
    fontSize: "0.95rem",
  },
  fileSize: {
    color: "#666",
    fontSize: "0.85rem",
    backgroundColor: "#f5f5f5",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  optimizationInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px dashed #ddd",
  },
  savingsBadge: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold" as const,
    display: "inline-block",
    width: "fit-content",
  },
  sizeComparison: {
    fontSize: "0.85rem",
    color: "#666",
    fontFamily: "monospace",
  },
  noSavings: {
    fontSize: "0.85rem",
    color: "#757575",
    fontStyle: "italic" as const,
    marginTop: "5px",
  },
  progressContainer: {
    margin: "20px 0",
  },
  progressBar: {
    width: "100%",
    height: "10px",
    backgroundColor: "#e0e0e0",
    borderRadius: "5px",
    overflow: "hidden",
    marginBottom: "5px",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34a853",
    transition: "width 0.3s",
  },
  progressText: {
    fontSize: "0.9rem",
    color: "#666",
  },
  error: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "12px",
    borderRadius: "6px",
    margin: "15px 0",
    textAlign: "center" as const,
  },
  uploadButton: {
    backgroundColor: "#4285f4",
    color: "white",
    border: "none",
    padding: "12px 30px",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600" as const,
    cursor: "pointer",
    marginTop: "10px",
  },
  uploadedFiles: {
    backgroundColor: "#e8f5e9",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "25px",
  },
  fileList: {
    listStyleType: "none",
    padding: 0,
    margin: "10px 0 0 0",
  },
  fileItem: {
    padding: "8px 0",
    borderBottom: "1px dashed #c8e6c9",
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
    fontSize: "0.9rem",
  },
  note: {
    fontStyle: "italic" as const,
    color: "#1976d2",
    marginTop: "10px",
  },
};

export default FileUpload;
