// components/FirestoreFileList.tsx
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { firestore } from "../lib/firebase";

interface FileListProps {
  userId: string;
}

interface FileDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: any;
  storagePath: string;
}

const FirestoreFileList: React.FC<FileListProps> = ({ userId }) => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    const filesCollection = collection(firestore, `users/${userId}/files`);
    const filesQuery = query(filesCollection, orderBy("uploadedAt", "desc"));

    const unsubscribe = onSnapshot(
      filesQuery,
      (snapshot) => {
        const filesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FileDocument[];
        setFiles(filesList);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Failed to load files");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <div>Loading files...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div>
      <h3>📁 Files in Firestore</h3>
      {files.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.id}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name}
              </a>
              <span> ({(file.size / 1024).toFixed(2)} KB)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FirestoreFileList;
