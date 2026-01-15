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

interface Settings {
  locations: string[];
  boughtFor: string[];
  goldRatePerGram: number;
  makingTaxPercent: number;
  resaleDiscountPercent: number;
  liabilities: number;
  showInactive: boolean;
  showDelete: boolean;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  addLocation: (location: string) => void;
  removeLocation: (location: string) => void;
  addBoughtFor: (purpose: string) => void;
  removeBoughtFor: (purpose: string) => void;
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
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
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
  const settingsRef = doc(firestore, "settings", "app");

  useEffect(() => {
    const unsubscribe = onSnapshot(settingsRef, (docSnapshot) => {
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
        });
      } else {
        // Create default document if it doesn't exist
        setDoc(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      await updateDoc(settingsRef, updates);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const addLocation = async (location: string) => {
    try {
      await updateDoc(settingsRef, {
        locations: arrayUnion(location.trim()),
      });
    } catch (error) {
      console.error("Error adding location:", error);
    }
  };

  const removeLocation = async (location: string) => {
    try {
      await updateDoc(settingsRef, {
        locations: arrayRemove(location),
      });
    } catch (error) {
      console.error("Error removing location:", error);
    }
  };

  const addBoughtFor = async (purpose: string) => {
    try {
      await updateDoc(settingsRef, {
        boughtFor: arrayUnion(purpose.trim()),
      });
    } catch (error) {
      console.error("Error adding boughtFor:", error);
    }
  };

  const removeBoughtFor = async (purpose: string) => {
    try {
      await updateDoc(settingsRef, {
        boughtFor: arrayRemove(purpose),
      });
    } catch (error) {
      console.error("Error removing boughtFor:", error);
    }
  };

  const value = {
    settings,
    loading,
    updateSettings,
    addLocation,
    removeLocation,
    addBoughtFor,
    removeBoughtFor,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
