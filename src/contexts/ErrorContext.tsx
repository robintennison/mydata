import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (message: string | null) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = (message: string | null) => {
    setErrorState(message);
    if (message) {
      console.error('App Error:', message);
      // Automatically clear error after 5 seconds
      setTimeout(() => {
        setErrorState(null);
      }, 5000);
    }
  };

  const clearError = () => setErrorState(null);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ea4335',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️ {error}</span>
          <button 
            onClick={clearError}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>
      )}
    </ErrorContext.Provider>
  );
};
