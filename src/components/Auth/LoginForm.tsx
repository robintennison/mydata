import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      // Handle specific Firebase errors
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled");
          break;
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.title}>Login to Your Account</h3>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? (
          <>
            <span style={styles.spinner}></span> Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div style={styles.note}>
        <p style={styles.noteText}>
          💡 <strong>Note:</strong> Use the same credentials as your Android app
        </p>
        <p style={styles.noteText}>
          This connects to your existing Firebase project:{" "}
          <code>robintennison-mydata</code>
        </p>
      </div>
    </form>
  );
};

const styles = {
  form: {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
  },
  title: {
    marginBottom: "1.5rem",
    color: "#333",
    textAlign: "center" as const,
  },
  inputGroup: {
    marginBottom: "1.2rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600" as const,
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
    transition: "border 0.3s",
    boxSizing: "border-box" as const,
  },
  error: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  button: {
    width: "100%",
    backgroundColor: "#4285f4",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600" as const,
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "50%",
    borderTopColor: "white",
    animation: "spin 1s linear infinite",
    marginRight: "8px",
    verticalAlign: "middle",
  },
  note: {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    textAlign: "left" as const,
  },
  noteText: {
    margin: "0.3rem 0",
    fontSize: "0.9rem",
    color: "#666",
  },
};

export default LoginForm;
