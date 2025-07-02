
import { useState, useEffect } from 'react';

interface Event {
  id: string;
  youngesterId: string;
  youngsterName: string;
  type: string;
  description: string;
  date: string;
  timestamp: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Charger les événements depuis localStorage
    const savedEvents = localStorage.getItem('youngster-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const addEvent = (youngesterId: string, youngsterName: string, type: string, description: string) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      youngesterId,
      youngsterName,
      type,
      description,
      date: new Date().toLocaleDateString('fr-FR'),
      timestamp: new Date().toISOString()
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('youngster-events', JSON.stringify(updatedEvents));

    return newEvent;
  };

  return { events, addEvent };
};
