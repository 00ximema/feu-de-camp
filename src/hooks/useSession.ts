
import { useState, useEffect } from 'react';

export interface Session {
  id: string;
  name: string;
  createdAt: string;
}

export const useSession = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  // Charger les sessions depuis le localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('vacation-sessions');
    const savedCurrentSession = localStorage.getItem('current-session');
    
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      
      if (savedCurrentSession) {
        const currentSessionData = JSON.parse(savedCurrentSession);
        const foundSession = parsedSessions.find((s: Session) => s.id === currentSessionData.id);
        if (foundSession) {
          setCurrentSession(foundSession);
        }
      }
    }
  }, []);

  // Sauvegarder les sessions dans le localStorage
  const saveSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    localStorage.setItem('vacation-sessions', JSON.stringify(newSessions));
  };

  // Créer une nouvelle session
  const createSession = (name: string) => {
    const newSession: Session = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    
    const newSessions = [...sessions, newSession];
    saveSessions(newSessions);
    setCurrentSession(newSession);
    localStorage.setItem('current-session', JSON.stringify(newSession));
  };

  // Supprimer une session
  const deleteSession = (sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(newSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      localStorage.removeItem('current-session');
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
    switchSession
  };
};
