import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, runTransaction } from "firebase/firestore";
import { auth, firestore } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { useError } from "./ErrorContext";
import { readSettings, validateSettings, renameSettingItem } from "../utils/settings";
import type { Settings } from "../utils/settings";
export type { Settings } from "../utils/settings";

type ListField = "locations" | "boughtFor";
interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
  addLocation: (value: string) => Promise<boolean>;
  removeLocation: (value: string) => Promise<boolean>;
  addBoughtFor: (value: string) => Promise<boolean>;
  removeBoughtFor: (value: string) => Promise<boolean>;
  renameItem: (field: ListField, oldValue: string, newValue: string) => Promise<boolean>;
}
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { setError } = useError();
  const [state, setState] = useState<{
    uid: string; settings: Settings | null; loading: boolean; error: string | null;
  }>({ uid: "", settings: null, loading: true, error: null });
  const uid = user?.uid;

  useEffect(() => {
    if (!uid || isLoading) return;
    let active = true;
    const fail = (message: string) => {
      if (active) setState(prev => ({ uid, settings: prev.uid === uid ? prev.settings : null, loading: false, error: message }));
    };
    const unsubscribe = onSnapshot(doc(firestore, "settings", "app"), { includeMetadataChanges: true }, snapshot => {
      if (!active) return;
      if (!snapshot.exists()) {
        fail(snapshot.metadata.fromCache
          ? "Settings are not available in the cache. Connect to load settings."
          : "The settings/app document is missing. Restore it in Firestore; defaults have not been saved.");
        return;
      }
      // Only display confirmed values; failed writes must not look like saved settings.
      if (snapshot.metadata.hasPendingWrites) return;
      try {
        const settings = readSettings(snapshot.data());
        setState({ uid, settings, loading: false, error: null });
      } catch (error) {
        fail(`Invalid settings data: ${error instanceof Error ? error.message : "Check Firestore values."}`);
      }
    }, () => fail("Unable to load settings. Check your connection and Firestore permissions, then reload."));
    return () => { active = false; unsubscribe(); };
  }, [uid, isLoading]);

  const settings = uid && state.uid === uid ? state.settings : null;
  const error = uid && state.uid === uid ? state.error : null;
  const loading = isLoading || Boolean(uid && (state.uid !== uid || state.loading));
  const save = async (operation: () => Promise<unknown>): Promise<boolean> => {
    try {
      if (!uid || auth.currentUser?.uid !== uid || loading || error || !settings) {
        throw new Error("Settings are not ready to save. Reload after signing in and check your connection.");
      }
      await operation();
      return true;
    } catch (error) {
      setError(error instanceof Error ? `Failed to save settings: ${error.message}` : "Failed to save settings.");
      return false;
    }
  };
  const updateSettings = (updates: Partial<Settings>) => save(async () => {
    validateSettings(updates);
    // updateDoc changes only supplied fields and cannot recreate a missing document.
    await updateDoc(doc(firestore, "settings", "app"), updates);
  });
  const changeList = (field: ListField, value: string, add: boolean) => save(async () => {
    const item = add ? value.trim() : value;
    validateSettings({ [field]: [item] });
    await updateDoc(doc(firestore, "settings", "app"), { [field]: add ? arrayUnion(item) : arrayRemove(item) });
  });
  const renameItem = (field: ListField, oldValue: string, newValue: string) => save(async () => {
    const item = newValue.trim();
    validateSettings({ [field]: [item] });
    const ref = doc(firestore, "settings", "app");
    await runTransaction(firestore, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("Settings document is missing.");
      const current = readSettings(snapshot.data());
      transaction.update(ref, { [field]: renameSettingItem(current[field], oldValue, item) });
    });
  });
  return <SettingsContext.Provider value={{ settings, loading, error, updateSettings,
    addLocation: value => changeList("locations", value, true),
    removeLocation: value => changeList("locations", value, false),
    addBoughtFor: value => changeList("boughtFor", value, true),
    removeBoughtFor: value => changeList("boughtFor", value, false), renameItem,
  }}>{children}</SettingsContext.Provider>;
};
