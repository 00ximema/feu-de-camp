
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
        setSessions(dbSessions);
        
        const savedCurrentSession = localStorage.getItem('current-session');
        if (savedCurrentSession) {
          const currentSessionData = JSON.parse(savedCurrentSession);
          const foundSession = dbSessions.find((s: Session) => s.id === currentSessionData.id);
          if (foundSession) {
            setCurrentSession(foundSession);
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
      console.log('Session créée et enregistrée en base de données');
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
    }
  };

  // Supprimer une session
  const deleteSession = async (sessionId: string) => {
    if (!isInitialized) return;
    
    try {
      await db.delete('sessions', sessionId);
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        localStorage.removeItem('current-session');
      }
      console.log('Session supprimée de la base de données');
    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error);
    }
  };

  // Changer de session active
  const switchSession = (session: Session) => {
    setCurrentSession(session);
    localStorage.setItem('current-session', JSON.stringify(session));
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
