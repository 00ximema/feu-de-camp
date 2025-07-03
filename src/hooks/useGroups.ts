
import { useState, useEffect } from 'react';
import { useLocalDatabase } from './useLocalDatabase';
import { useSession } from './useSession';

export interface GroupeJeunes {
  id: string;
  sessionId?: string;
  nom: string;
  description?: string;
  couleur: string;
  jeunesIds: string[];
  createdAt: string;
}

export const useGroups = () => {
  const [groupes, setGroupes] = useState<GroupeJeunes[]>([]);
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les groupes depuis la base de données
  useEffect(() => {
    const loadGroupes = async () => {
      if (!isInitialized) return;
      
      try {
        const dbGroupes = await db.getAll('groupes', currentSession?.id);
        setGroupes(dbGroupes);
        console.log('Groupes chargés depuis la base de données:', dbGroupes);
      } catch (error) {
        console.error('Erreur lors du chargement des groupes:', error);
      }
    };

    loadGroupes();
  }, [isInitialized, db, currentSession]);

  // Ajouter un groupe
  const addGroupe = async (groupe: Omit<GroupeJeunes, 'id' | 'createdAt'>) => {
    if (!isInitialized) return null;
    
    const newGroupe: GroupeJeunes = {
      ...groupe,
      id: Date.now().toString(),
      sessionId: currentSession?.id,
      createdAt: new Date().toISOString()
    };

    try {
      await db.save('groupes', newGroupe);
      const updatedGroupes = [...groupes, newGroupe];
      setGroupes(updatedGroupes);
      console.log('Groupe enregistré en base de données');
      return newGroupe;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du groupe:', error);
      return null;
    }
  };

  // Mettre à jour un groupe
  const updateGroupe = async (id: string, updates: Partial<GroupeJeunes>) => {
    if (!isInitialized) return null;
    
    const groupe = groupes.find(g => g.id === id);
    if (!groupe) return null;

    const updatedGroupe = { ...groupe, ...updates };

    try {
      await db.save('groupes', updatedGroupe);
      const updatedGroupes = groupes.map(g => g.id === id ? updatedGroupe : g);
      setGroupes(updatedGroupes);
      console.log('Groupe mis à jour en base de données');
      return updatedGroupe;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du groupe:', error);
      return null;
    }
  };

  // Supprimer un groupe
  const deleteGroupe = async (id: string) => {
    if (!isInitialized) return false;
    
    try {
      await db.delete('groupes', id);
      const updatedGroupes = groupes.filter(g => g.id !== id);
      setGroupes(updatedGroupes);
      console.log('Groupe supprimé de la base de données');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
      return false;
    }
  };

  // Ajouter un jeune à un groupe
  const addJeuneToGroupe = async (groupeId: string, jeuneId: string) => {
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe || groupe.jeunesIds.includes(jeuneId)) return false;

    return await updateGroupe(groupeId, {
      jeunesIds: [...groupe.jeunesIds, jeuneId]
    });
  };

  // Retirer un jeune d'un groupe
  const removeJeuneFromGroupe = async (groupeId: string, jeuneId: string) => {
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe) return false;

    return await updateGroupe(groupeId, {
      jeunesIds: groupe.jeunesIds.filter(id => id !== jeuneId)
    });
  };

  return {
    groupes,
    addGroupe,
    updateGroupe,
    deleteGroupe,
    addJeuneToGroupe,
    removeJeuneFromGroupe,
    isInitialized
  };
};
