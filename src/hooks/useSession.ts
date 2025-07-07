
import { useState, useEffect } from 'react';
import { useLocalDatabase } from './useLocalDatabase';

export interface Session {
  id: string;
  name: string;
  createdAt: string;
}

export const useSession = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const { isInitialized, db } = useLocalDatabase();

  // Charger les sessions depuis la base de données
  useEffect(() => {
    const loadSessions = async () => {
      if (!isInitialized) return;
      
      try {
        const dbSessions = await db.getAll('sessions');
        console.log('Sessions chargées depuis la DB:', dbSessions);
        setSessions(dbSessions);
        
        const savedCurrentSession = localStorage.getItem('current-session');
        if (savedCurrentSession) {
          const currentSessionData = JSON.parse(savedCurrentSession);
          console.log('Session courante depuis localStorage:', currentSessionData);
          const foundSession = dbSessions.find((s: Session) => s.id === currentSessionData.id);
          if (foundSession) {
            setCurrentSession(foundSession);
            console.log('Session courante trouvée et définie:', foundSession);
          } else {
            console.log('Session courante non trouvée dans la DB, nettoyage localStorage');
            localStorage.removeItem('current-session');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sessions:', error);
      }
    };

    loadSessions();
  }, [isInitialized, db]);

  // Créer une nouvelle session
  const createSession = async (name: string) => {
    if (!isInitialized) return;
    
    const newSession: Session = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    
    try {
      await db.save('sessions', newSession);
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      setCurrentSession(newSession);
      localStorage.setItem('current-session', JSON.stringify(newSession));
      console.log('Nouvelle session créée:', newSession);
      console.log('Session définie comme courante');
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
    }
  };

  // Supprimer une session
  const deleteSession = async (sessionId: string) => {
    if (!isInitialized) return;
    
    try {
      // Supprimer toutes les données liées à cette session
      console.log('Suppression de la session et de toutes ses données:', sessionId);
      
      const tables = ['animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures'];
      
      for (const table of tables) {
        const sessionData = await db.getAll(table as any, sessionId);
        console.log(`Suppression de ${sessionData.length} éléments de la table ${table}`);
        for (const item of sessionData) {
          await db.delete(table as any, item.id);
        }
      }
      
      // Supprimer la session elle-même
      await db.delete('sessions', sessionId);
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        localStorage.removeItem('current-session');
        console.log('Session courante supprimée et réinitialisée');
      }
      
      console.log('Session et données associées supprimées avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error);
    }
  };

  // Changer de session active
  const switchSession = (session: Session) => {
    setCurrentSession(session);
    localStorage.setItem('current-session', JSON.stringify(session));
    console.log('Session basculée vers:', session);
  };

  return {
    sessions,
    currentSession,
    createSession,
    deleteSession,
    switchSession,
    isInitialized
  };
};
