// src/contexts/SettingsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
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

  // Store last known good settings to prevent data loss
  const lastKnownSettings = useRef<Settings | null>(null);

  useEffect(() => {
    const settingsRef = doc(firestore, "settings", "app");

    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          // Create settings from Firebase data
          const firebaseSettings: Settings = {
            locations: data.locations ?? [],
            boughtFor: data.boughtFor ?? [],
            goldRatePerGram: data.goldRatePerGram ?? 0,
            makingTaxPercent: data.makingTaxPercent ?? 0,
            resaleDiscountPercent: data.resaleDiscountPercent ?? 0,
            liabilities: data.liabilities ?? 0,
            showInactive: data.showInactive ?? false,
            showDelete: data.showDelete ?? false,
            EMW_interest: data.EMW_interest ?? 5,
            EMW_Date: data.EMW_Date ?? "2044-10",
          };

          // Store as last known good settings
          lastKnownSettings.current = firebaseSettings;
          setSettings(firebaseSettings);
          setHasPermissionError(false); // Reset if we succeed
        } else {
          // Document doesn't exist - create it
          setDoc(settingsRef, defaultSettings).catch(console.error);
          setSettings(defaultSettings);
          lastKnownSettings.current = defaultSettings;
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firebase onSnapshot error:", error);

        // Check if it's a permission error
        if (error.code === "permission-denied") {
          console.log(
            "Permission denied for settings - using last known settings if available",
          );
          setHasPermissionError(true);

          // IMPORTANT: Use last known settings instead of defaults if available
          if (lastKnownSettings.current) {
            console.log(
              "Using last known settings:",
              lastKnownSettings.current,
            );
            setSettings(lastKnownSettings.current);
          } else {
            console.log("No last known settings, using defaults");
            setSettings(defaultSettings);
          }
          // DON'T set error for permission-denied - it's expected before login
        } else if (
          error.code === "unavailable" ||
          error.message.includes("network")
        ) {
          console.log(
            "Firebase unavailable - using last known settings if available",
          );

          // Use last known settings during network issues
          if (lastKnownSettings.current) {
            setSettings(lastKnownSettings.current);
          } else {
            setSettings(defaultSettings);
          }
          setError("Firebase connection error.");
        } else {
          // Only show error for unexpected errors
          setError("Firebase connection error.");
          // Still try to use last known settings
          if (lastKnownSettings.current) {
            setSettings(lastKnownSettings.current);
          }
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [setError]); // Remove hasPermissionError from dependencies

  const updateSettings = async (updates: Partial<Settings>) => {
    // Optimistically update local state
    setSettings((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // Update last known settings
      lastKnownSettings.current = updated;
      return updated;
    });

    // If we had permission errors, don't try to update Firestore
    if (hasPermissionError) {
      console.log("Cannot update settings: No Firestore permission");
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

    // Optimistically update local state
    setSettings((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        locations: [...prev.locations, trimmed],
      };
      lastKnownSettings.current = updated;
      return updated;
    });

    if (hasPermissionError) {
      console.log("Cannot add location: No Firestore permission");
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
    // Optimistically update local state
    setSettings((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        locations: prev.locations.filter((l) => l !== location),
      };
      lastKnownSettings.current = updated;
      return updated;
    });

    if (hasPermissionError) {
      console.log("Cannot remove location: No Firestore permission");
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

    // Optimistically update local state
    setSettings((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        boughtFor: [...prev.boughtFor, trimmed],
      };
      lastKnownSettings.current = updated;
      return updated;
    });

    if (hasPermissionError) {
      console.log("Cannot add boughtFor: No Firestore permission");
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
    // Optimistically update local state
    setSettings((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        boughtFor: prev.boughtFor.filter((p) => p !== purpose),
      };
      lastKnownSettings.current = updated;
      return updated;
    });

    if (hasPermissionError) {
      console.log("Cannot remove boughtFor: No Firestore permission");
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
        settings, // Don't fallback to defaultSettings here
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
