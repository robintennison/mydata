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
  const settingsRef = doc(firestore, "settings", "app");

  useEffect(() => {
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
        } else {
          setDoc(settingsRef, defaultSettings).catch(() => {
            setError("Failed to initialize settings.");
          });
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firebase onSnapshot error:", error);
        setError("Firebase connection error.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [setError]);

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      await updateDoc(settingsRef, updates);
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to save settings.");
    }
  };

  const addLocation = async (location: string) => {
    const trimmed = location.trim();
    if (!trimmed) return;

    try {
      await updateDoc(settingsRef, {
        locations: arrayUnion(trimmed),
      });
    } catch (error) {
      console.error("Error adding location:", error);
      setError("Failed to add location.");
    }
  };

  const removeLocation = async (location: string) => {
    try {
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

    try {
      await updateDoc(settingsRef, {
        boughtFor: arrayUnion(trimmed),
      });
    } catch (error) {
      console.error("Error adding boughtFor:", error);
      setError("Failed to update preferences.");
    }
  };

  const removeBoughtFor = async (purpose: string) => {
    try {
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
        settings,
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
