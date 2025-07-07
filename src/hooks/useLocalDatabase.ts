
import { useState, useEffect } from 'react';
import { localDB } from '@/services/localDatabase';

export const useLocalDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await localDB.init();
        // Migration automatique au premier lancement
        const hasMigrated = localStorage.getItem('db-migrated');
        if (!hasMigrated) {
          await localDB.migrateFromLocalStorage();
          localStorage.setItem('db-migrated', 'true');
        }
        
        // Nettoyage des données orphelines pour la session courante
        const currentSessionStr = localStorage.getItem('current-session');
        if (currentSessionStr) {
          const currentSession = JSON.parse(currentSessionStr);
          await localDB.cleanOrphanedData(currentSession.id);
        }
        setIsInitialized(true);
        console.log('Base de données locale initialisée');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
      }
    };

    initDB();
  }, []);

  return {
    isInitialized,
    db: localDB
  };
};
