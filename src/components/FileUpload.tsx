import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, database } from "../lib/firebase";
import { ref as dbRef, set, push } from "firebase/database";

interface FileUploadProps {
  userId: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ userId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create a storage reference
      const storageRef = ref(
        storage,
        `users/${userId}/${Date.now()}_${file.name}`
      );

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

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
          const filesRef = dbRef(database, `users/${userId}/files`);
          const newFileRef = push(filesRef);
          await set(newFileRef, {
            name: file.name,
            url: downloadURL,
            size: file.size,
            type: file.type,
            uploadedAt: Date.now(),
          });

          setUploadedFiles((prev) => [...prev, file.name]);
          setFile(null);
          setProgress(0);
          setUploading(false);

          // Reset file input
          const fileInput = document.getElementById(
            "file-input"
          ) as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        }
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
        Files will be stored in the same Storage as your Android app
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
            <span style={styles.fileName}>📄 {file.name}</span>
            <span style={styles.fileSize}>
              ({(file.size / 1024).toFixed(2)} KB)
            </span>
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
          {uploading ? "Uploading..." : "Upload to Firebase Storage"}
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
          <strong>Storage Path:</strong> users/{userId}/
        </p>
        <p>
          <strong>Connection:</strong> Same Firebase Storage as Android app
        </p>
        <p style={styles.note}>
          Uploaded files will be accessible from both web and Android app
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
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  fileName: {
    fontWeight: "bold" as const,
  },
  fileSize: {
    color: "#666",
    fontSize: "0.9rem",
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
