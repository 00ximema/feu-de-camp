
import { useState, useEffect } from 'react';
import { useLocalDatabase } from './useLocalDatabase';
import { useSession } from './useSession';

interface Event {
  id: string;
  sessionId?: string;
  youngesterId: string;
  youngsterName: string;
  type: string;
  description: string;
  date: string;
  timestamp: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  useEffect(() => {
    const loadEvents = async () => {
      if (!isInitialized) return;
      
      try {
        const dbEvents = await db.getAll('events', currentSession?.id);
        setEvents(dbEvents);
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
      }
    };

    loadEvents();
  }, [isInitialized, db, currentSession]);

  const addEvent = async (youngesterId: string, youngsterName: string, type: string, description: string) => {
    if (!isInitialized) return null;
    
    const newEvent: Event = {
      id: Date.now().toString(),
      sessionId: currentSession?.id,
      youngesterId,
      youngsterName,
      type,
      description,
      date: new Date().toLocaleDateString('fr-FR'),
      timestamp: new Date().toISOString()
    };

    try {
      await db.save('events', newEvent);
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      console.log('Événement enregistré en base de données');
      return newEvent;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'événement:', error);
      return null;
    }
  };

  return { events, addEvent };
};
