// src/contexts/SettingsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { firestore } from "../lib/firebase";
import { useError } from "./ErrorContext";

export interface Settings {
  locations: string[];
  boughtFor: string[];
  goldRatePerGram: number;
  makingTaxPercent: number;
  resaleDiscountPercent: number;
  liabilities: number;
  showInactive: boolean;
  showDelete: boolean;
  EMW_interest: number;
  EMW_Date: string;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  addLocation: (location: string) => Promise<void>;
  removeLocation: (location: string) => Promise<void>;
  addBoughtFor: (purpose: string) => Promise<void>;
  removeBoughtFor: (purpose: string) => Promise<void>;
}

const defaultSettings: Settings = {
  locations: [],
  boughtFor: [],
  goldRatePerGram: 0,
  makingTaxPercent: 0,
  resaleDiscountPercent: 0,
  liabilities: 0,
  showInactive: false,
  showDelete: false,
  EMW_interest: 5,
  EMW_Date: "2044-10",
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { setError } = useError();
  const [hasPermissionError, setHasPermissionError] = useState(false);

  useEffect(() => {
    // Don't try to load settings if we already know we don't have permission
    if (hasPermissionError) {
      console.log("Using default settings due to previous permission error");
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    const settingsRef = doc(firestore, "settings", "app");

    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          setSettings({
            locations: data.locations || [],
            boughtFor: data.boughtFor || [],
            goldRatePerGram: data.goldRatePerGram || 0,
            makingTaxPercent: data.makingTaxPercent || 0,
            resaleDiscountPercent: data.resaleDiscountPercent || 0,
            liabilities: data.liabilities || 0,
            showInactive: data.showInactive || false,
            showDelete: data.showDelete || false,
            EMW_interest: data.EMW_interest ?? 5,
            EMW_Date: data.EMW_Date || "2044-10",
          });
          setHasPermissionError(false); // Reset if we succeed
        } else {
          // Only try to create default settings if we have permission
          setDoc(settingsRef, defaultSettings).catch(() => {
            // If we can't create, just use defaults without error
            setSettings(defaultSettings);
          });
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firebase onSnapshot error:", error);

        // Check if it's a permission error
        if (error.code === "permission-denied") {
          console.log(
            "Permission denied for settings - using defaults without Firestore",
          );
          setHasPermissionError(true); // Mark that we don't have permission
          setSettings(defaultSettings);
          // DON'T set error for permission-denied - it's expected before login
        } else if (
          error.code === "unavailable" ||
          error.message.includes("network")
        ) {
          console.log("Firebase unavailable - using default settings");
          setSettings(defaultSettings);
          setError("Firebase connection error.");
        } else {
          // Only show error for unexpected errors
          setError("Firebase connection error.");
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [setError, hasPermissionError]); // Add hasPermissionError to dependencies

  const updateSettings = async (updates: Partial<Settings>) => {
    // If we had permission errors, don't try to update Firestore
    if (hasPermissionError) {
      console.log("Cannot update settings: No Firestore permission");
      // Still update local state for better UX
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
      return;
    }

    try {
      const settingsRef = doc(firestore, "settings", "app");
      await updateDoc(settingsRef, updates);
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to save settings.");
    }
  };

  const addLocation = async (location: string) => {
    const trimmed = location.trim();
    if (!trimmed) return;

    if (hasPermissionError) {
      console.log("Cannot add location: No Firestore permission");
      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              locations: [...prev.locations, trimmed],
            }
          : null,
      );
      return;
    }

    try {
      const settingsRef = doc(firestore, "settings", "app");
      await updateDoc(settingsRef, {
        locations: arrayUnion(trimmed),
      });
    } catch (error) {
      console.error("Error adding location:", error);
      setError("Failed to add location.");
    }
  };

  const removeLocation = async (location: string) => {
    if (hasPermissionError) {
      console.log("Cannot remove location: No Firestore permission");
      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              locations: prev.locations.filter((l) => l !== location),
            }
          : null,
      );
      return;
    }

    try {
      const settingsRef = doc(firestore, "settings", "app");
      await updateDoc(settingsRef, {
        locations: arrayRemove(location),
      });
    } catch (error) {
      console.error("Error removing location:", error);
      setError("Failed to remove location.");
    }
  };

  const addBoughtFor = async (purpose: string) => {
    const trimmed = purpose.trim();
    if (!trimmed) return;

    if (hasPermissionError) {
      console.log("Cannot add boughtFor: No Firestore permission");
      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              boughtFor: [...prev.boughtFor, trimmed],
            }
          : null,
      );
      return;
    }

    try {
      const settingsRef = doc(firestore, "settings", "app");
      await updateDoc(settingsRef, {
        boughtFor: arrayUnion(trimmed),
      });
    } catch (error) {
      console.error("Error adding boughtFor:", error);
      setError("Failed to update preferences.");
    }
  };

  const removeBoughtFor = async (purpose: string) => {
    if (hasPermissionError) {
      console.log("Cannot remove boughtFor: No Firestore permission");
      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              boughtFor: prev.boughtFor.filter((p) => p !== purpose),
            }
          : null,
      );
      return;
    }

    try {
      const settingsRef = doc(firestore, "settings", "app");
      await updateDoc(settingsRef, {
        boughtFor: arrayRemove(purpose),
      });
    } catch (error) {
      console.error("Error removing boughtFor:", error);
      setError("Failed to update preferences.");
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings: settings || defaultSettings, // Always return settings
        loading,
        updateSettings,
        addLocation,
        removeLocation,
        addBoughtFor,
        removeBoughtFor,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
