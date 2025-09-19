
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';

interface TeamDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  data?: string;
}

interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  email: string;
  role: string;
  diplomes: string[];
  notes: string;
  createdAt: string;
  documents?: TeamDocument[];
}

export const useTeamManagement = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  useEffect(() => {
    loadTeamMembers();
  }, [isInitialized, currentSession]);

  const loadTeamMembers = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const members = await db.getAll('animateurs', currentSession.id);
      setTeam(members.map(member => ({
        id: member.id.toString(),
        nom: member.nom,
        prenom: member.prenom,
        age: member.age,
        telephone: member.telephone,
        email: member.email,
        role: member.role,
        diplomes: member.formations || [],
        notes: member.notes,
        createdAt: new Date().toISOString(),
        documents: (member.documents || []).map(doc => ({
          id: doc.id.toString(),
          name: doc.nom,
          type: doc.type,
          uploadDate: doc.dateUpload,
          data: doc.url // S'assurer que les données sont bien mappées
        })).filter(doc => doc.data) // Filtrer les documents sans données
      })));
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe:', error);
    }
  };

  const saveTeamMember = async (memberData: any) => {
    if (!isInitialized || !currentSession) return;

    try {
      await db.save('animateurs', {
        ...memberData,
        sessionId: currentSession.id
      });
      await loadTeamMembers();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const addMember = async (memberData: Omit<TeamMember, 'id' | 'createdAt' | 'diplomes'> & { diplomes: string }) => {
    if (!currentSession) return;

    const member = {
      id: Date.now(),
      sessionId: currentSession.id,
      nom: memberData.nom.toUpperCase(),
      prenom: memberData.prenom,
      age: memberData.age,
      telephone: memberData.telephone,
      email: memberData.email,
      role: memberData.role,
      formations: memberData.diplomes.split(',').map(d => d.trim()).filter(d => d),
      documents: [],
      notes: memberData.notes
    };

    await saveTeamMember(member);

    toast({
      title: "Membre ajouté",
      description: `${memberData.prenom} ${memberData.nom} a été ajouté à l'équipe`
    });
  };

  const updateMember = async (updatedMember: TeamMember) => {
    if (!currentSession) return;

    const member = {
      id: parseInt(updatedMember.id),
      sessionId: currentSession.id,
      nom: updatedMember.nom,
      prenom: updatedMember.prenom,
      age: updatedMember.age,
      telephone: updatedMember.telephone,
      email: updatedMember.email,
      role: updatedMember.role,
      formations: updatedMember.diplomes,
      documents: (updatedMember.documents || []).map(doc => ({
        id: parseInt(doc.id),
        nom: doc.name,
        type: doc.type,
        dateUpload: doc.uploadDate,
        url: doc.data
      })),
      notes: updatedMember.notes
    };

    await saveTeamMember(member);
    
    toast({
      title: "Membre mis à jour",
      description: "Les informations ont été mises à jour avec succès"
    });
  };

  const deleteMember = async (memberId: string) => {
    if (!isInitialized) return;

    try {
      await db.delete('animateurs', parseInt(memberId));
      await loadTeamMembers();
      
      toast({
        title: "Membre supprimé",
        description: "Le membre a été supprimé de l'équipe"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const addDocument = async (memberId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const newDocument: TeamDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        uploadDate: new Date().toISOString(),
        data: e.target?.result as string
      };

      const member = team.find(m => m.id === memberId);
      if (member) {
        const updatedMember = {
          ...member,
          documents: [...(member.documents || []), newDocument]
        };
        await updateMember(updatedMember);
        
        toast({
          title: "Document ajouté",
          description: `${file.name} a été ajouté avec succès`
        });
      }
    };
    
    reader.readAsDataURL(file);
  };

  const deleteDocument = async (memberId: string, documentId: string) => {
    const member = team.find(m => m.id === memberId);
    if (member) {
      const updatedMember = {
        ...member,
        documents: member.documents?.filter(doc => doc.id !== documentId) || []
      };
      await updateMember(updatedMember);
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });
    }
  };

  const downloadDocument = (document: TeamDocument) => {
    try {
      if (!document.data) {
        toast({
          title: "Erreur",
          description: "Aucune donnée disponible pour ce document",
          variant: "destructive"
        });
        return;
      }

      // Vérifier si c'est une URL de données valide
      if (!document.data.startsWith('data:')) {
        toast({
          title: "Erreur",
          description: "Format de document invalide",
          variant: "destructive"
        });
        return;
      }

      // Créer un élément anchor temporaire pour le téléchargement
      const link = window.document.createElement('a');
      link.href = document.data;
      link.download = document.name;
      link.style.display = 'none';
      
      // Ajouter à la page, cliquer, puis supprimer
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      toast({
        title: "Téléchargement démarré",
        description: `${document.name} est en cours de téléchargement`
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  return {
    team,
    addMember,
    updateMember,
    deleteMember,
    addDocument,
    deleteDocument,
    downloadDocument
  };
};
