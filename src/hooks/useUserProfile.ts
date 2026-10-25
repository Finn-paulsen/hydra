/**
 * useUserProfile Hook
 * Verwaltet Persistierung und Aktualisierung von User-Profilen
 */

import { useCallback } from 'react';
import { storageManager, StorageKeys } from '../utils/storageManager';

export function useUserProfile() {
  
  // Laden des aktuellen User-Profils
  const loadProfile = useCallback(async () => {
    return await storageManager.getUserProfile();
  }, []);

  // Speichern/Update des User-Profils
  const updateProfile = useCallback(async (profileData: Record<string, any>) => {
    const current = await storageManager.getUserProfile();
    const updated = {
      ...current,
      ...profileData,
      lastModified: new Date().toISOString()
    };
    await storageManager.setUserProfile(updated);
    return updated;
  }, []);

  // Ändert Features/Instellungen des aktuellen Users
  const updateSettings = useCallback(async (settings: Record<string, any>) => {
    const profile = await loadProfile();
    const updated = {
      ...profile,
      settings: {
        ...profile?.settings,
        ...settings
      },
      lastModified: new Date().toISOString()
    };
    await storageManager.setUserProfile(updated);
    return updated;
  }, [loadProfile]);

  // Login-User setzen
  const setLoginUser = useCallback(async (userData: Record<string, any>) => {
    const profile = {
      ...userData,
      lastLogin: new Date().toISOString(),
      loginCount: (userData.loginCount || 0) + 1,
      settings: userData.settings || {
        theme: 'dark',
        fontSize: 12,
        notifications: true,
        autoSave: true
      }
    };
    await storageManager.setUserProfile(profile);
    return profile;
  }, []);

  // Logout - speichere letzte Session
  const logout = useCallback(async () => {
    const profile = await loadProfile();
    if (profile) {
      const updated = {
        ...profile,
        lastLogout: new Date().toISOString(),
        isLoggedIn: false
      };
      await storageManager.setUserProfile(updated);
    }
  }, [loadProfile]);

  // Gib Favoriten zurück
  const getFavorites = useCallback(async () => {
    const profile = await loadProfile();
    return profile?.favorites || [];
  }, [loadProfile]);

  // Füge zu Favoriten hinzu
  const addFavorite = useCallback(async (favorite: { id: string | number; [k: string]: any }) => {
    const profile = await loadProfile();
    const favorites = profile?.favorites || [];
    
    if (!favorites.find((f: { id: string | number }) => f.id === favorite.id)) {
      favorites.push({
        ...favorite,
        addedAt: new Date().toISOString()
      });
      await updateProfile({ favorites });
    }
    return favorites;
  }, [loadProfile, updateProfile]);

  // Entferne aus Favoriten
  const removeFavorite = useCallback(async (favoriteId: string | number) => {
    const profile = await loadProfile();
    const favorites = (profile?.favorites || []).filter((f: { id: string | number }) => f.id !== favoriteId);
    await updateProfile({ favorites });
    return favorites;
  }, [loadProfile, updateProfile]);

  return {
    loadProfile,
    updateProfile,
    updateSettings,
    setLoginUser,
    logout,
    getFavorites,
    addFavorite,
    removeFavorite
  };
}

export default useUserProfile;
