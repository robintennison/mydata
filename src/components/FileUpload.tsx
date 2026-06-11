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
    <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
      <h3 className="text-2xl font-semibold text-gray-800 mt-0">
        📁 Upload Files to Firebase Storage
      </h3>
      <p className="text-gray-600 mb-6">
        Files will be automatically optimized to save space
      </p>

      <div className="border-2 border-dashed border-blue-500 rounded-lg p-8 text-center bg-gray-50 mb-5">
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block mx-auto mb-5 p-2.5 border border-gray-300 rounded-md cursor-pointer w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {file && (
          <div className="mb-5 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-semibold text-sm">
                📄 {file.name}
              </span>
              <span className="text-gray-600 text-xs bg-gray-100 px-2 py-0.5 rounded">
                {formatFileSize(file.size)}
              </span>
            </div>

            {optimizationInfo && optimizationInfo.savedPercentage > 0 && (
              <div className="flex flex-col gap-2 mt-2.5 pt-2.5 border-t border-dashed border-gray-300">
                <div className="bg-green-500 text-white px-3 py-1 rounded-xl text-xs font-bold inline-block w-fit">
                  🎯 {optimizationInfo.savedPercentage.toFixed(1)}% saved
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {formatFileSize(optimizationInfo.originalSize)} →{" "}
                  {formatFileSize(optimizationInfo.optimizedSize)}
                </div>
              </div>
            )}

            {optimizationInfo && optimizationInfo.savedPercentage === 0 && (
              <div className="text-xs text-gray-500 italic mt-1">
                File is already optimized
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="my-5">
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {progress.toFixed(1)}%
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md my-4 text-center">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-500 text-white border-none px-8 py-3 rounded-md text-base font-semibold cursor-pointer mt-2.5 transition-all hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
        >
          {uploading ? "Uploading..." : "Upload Optimized File"}
        </button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-green-50 p-5 rounded-lg mt-6">
          <h4 className="font-semibold text-gray-800 mb-2">
            ✅ Recently Uploaded:
          </h4>
          <ul className="list-none p-0 m-2.5">
            {uploadedFiles.map((filename, index) => (
              <li
                key={index}
                className="py-2 border-b border-dashed border-green-200 last:border-b-0"
              >
                📄 {filename}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg mt-5 text-sm">
        <p className="mb-2">
          <strong>Storage Path:</strong> {pathPrefix}/{userId}/
        </p>
        <p className="mb-2">
          <strong>File Optimization:</strong> Automatic size reduction
        </p>
        <p className="text-blue-700 italic mt-2.5">
          Images are compressed, HEIC files are converted to JPEG
        </p>
      </div>
    </div>
  );
};

export default FileUpload;