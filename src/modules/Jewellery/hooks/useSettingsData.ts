// jewellery/hooks/useSettingsData.ts
import { useSettings } from "../../../contexts/SettingsContext";

export const useJewellerySettings = () => {
  const { settings, loading } = useSettings();
  
  // Get locations from settings or return default values
  const getLocations = (): string[] => {
    if (settings?.locations && settings.locations.length > 0) {
      return settings.locations;
    }
    return ["Locker", "Home", "Bank", "Other"];
  };

  // Get boughtFor options from settings or return default values
  const getBoughtForOptions = (): string[] => {
    if (settings?.boughtFor && settings.boughtFor.length > 0) {
      return settings.boughtFor;
    }
    return ["Robin", "Sheela", "Family", "Other"];
  };

  // Check if we should show inactive items
  const shouldShowInactive = (): boolean => {
    return settings?.showInactive || false;
  };

  // Check if we should show delete buttons
  const shouldShowDelete = (): boolean => {
    return settings?.showDelete || false;
  };

  // Get gold rate for valuation
  const getGoldRate = (): number => {
    return settings?.goldRatePerGram || 0;
  };

  return {
    locations: getLocations(),
    boughtForOptions: getBoughtForOptions(),
    showInactive: shouldShowInactive(),
    showDelete: shouldShowDelete(),
    goldRate: getGoldRate(),
    settings,
    loading,
  };
};