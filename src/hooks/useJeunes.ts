
import { useState, useEffect } from 'react';
import { useLocalDatabase } from './useLocalDatabase';
import { useSession } from './useSession';
import { Youngster } from '../types/youngster';

export const useJeunes = () => {
  const [jeunes, setJeunes] = useState<Youngster[]>([]);
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les jeunes depuis la base de données
  useEffect(() => {
    const loadJeunes = async () => {
      if (!isInitialized) return;
      
      try {
        const dbJeunes = await db.getAll('jeunes', currentSession?.id);
        setJeunes(dbJeunes);
        console.log('Jeunes chargés depuis la base de données:', dbJeunes);
      } catch (error) {
        console.error('Erreur lors du chargement des jeunes:', error);
      }
    };

    loadJeunes();
  }, [isInitialized, db, currentSession]);

  // Ajouter un jeune
  const addJeune = async (jeune: Omit<Youngster, 'id'>) => {
    if (!isInitialized) return null;
    
    const newJeune: Youngster = {
      ...jeune,
      id: Date.now().toString(),
      sessionId: currentSession?.id,
      telephone: jeune.telephone || '',
      email: jeune.email || '',
      adresse: jeune.adresse || '',
      allergies: jeune.allergies || [],
      medicaments: jeune.medicaments || [],
      notes: jeune.notes || ''
    };

    try {
      await db.save('jeunes', newJeune);
      const updatedJeunes = [...jeunes, newJeune];
      setJeunes(updatedJeunes);
      console.log('Jeune enregistré en base de données');
      return newJeune;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du jeune:', error);
      return null;
    }
  };

  // Ajouter plusieurs jeunes (pour l'import Excel)
  const addMultipleJeunes = async (nouvellesJeunes: Omit<Youngster, 'id'>[]) => {
    if (!isInitialized) return [];
    
    const jeunesWithIds: Youngster[] = nouvellesJeunes.map((jeune, index) => ({
      ...jeune,
      id: (Date.now() + index).toString(),
      sessionId: currentSession?.id,
      telephone: jeune.telephone || '',
      email: jeune.email || '',
      adresse: jeune.adresse || '',
      allergies: jeune.allergies || [],
      medicaments: jeune.medicaments || [],
      notes: jeune.notes || ''
    }));

    try {
      await db.saveMany('jeunes', jeunesWithIds);
      const updatedJeunes = [...jeunes, ...jeunesWithIds];
      setJeunes(updatedJeunes);
      console.log(`${jeunesWithIds.length} jeunes enregistrés en base de données`);
      return jeunesWithIds;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des jeunes:', error);
      return [];
    }
  };

  // Mettre à jour un jeune
  const updateJeune = async (id: string, updates: Partial<Youngster>) => {
    if (!isInitialized) return null;
    
    const jeune = jeunes.find(j => j.id === id);
    if (!jeune) return null;

    const updatedJeune = { ...jeune, ...updates };

    try {
      await db.save('jeunes', updatedJeune);
      const updatedJeunes = jeunes.map(j => j.id === id ? updatedJeune : j);
      setJeunes(updatedJeunes);
      console.log('Jeune mis à jour en base de données');
      return updatedJeune;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du jeune:', error);
      return null;
    }
  };

  // Supprimer un jeune
  const deleteJeune = async (id: string) => {
    if (!isInitialized) return false;
    
    try {
      await db.delete('jeunes', id);
      const updatedJeunes = jeunes.filter(j => j.id !== id);
      setJeunes(updatedJeunes);
      console.log('Jeune supprimé de la base de données');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du jeune:', error);
      return false;
    }
  };

  return {
    jeunes,
    addJeune,
    addMultipleJeunes,
    updateJeune,
    deleteJeune,
    isInitialized
  };
};
