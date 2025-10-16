import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings, DEFAULT_SETTINGS } from '../types/settings';

/**
 * Hook to manage app settings
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to settings document
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'main'),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as Settings);
        } else {
          // Initialize with defaults if doesn't exist
          setDoc(doc(db, 'settings', 'main'), DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading settings:', error);
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      await setDoc(
        doc(db, 'settings', 'main'),
        { ...settings, ...newSettings },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return { settings, loading, updateSettings };
}
