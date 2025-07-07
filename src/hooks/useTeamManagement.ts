
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from './useLocalDatabase';
import { useSession } from './useSession';

interface TeamDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  data?: string;
}

interface TeamMember {
  id: string;
  sessionId?: string;
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
    const loadTeam = async () => {
      if (!isInitialized || !currentSession) {
        setTeam([]);
        return;
      }
      
      try {
        const dbTeam = await db.getAll('animateurs', currentSession.id);
        console.log('Équipe chargée depuis la DB pour session:', currentSession.id, dbTeam);
        
        const formattedTeam = dbTeam.map((member: any) => ({
          id: String(member.id),
          sessionId: member.sessionId,
          nom: member.nom,
          prenom: member.prenom,
          age: member.age,
          telephone: member.telephone,
          email: member.email,
          role: member.role,
          diplomes: member.formations || [],
          notes: member.notes,
          createdAt: member.createdAt || new Date().toISOString(),
          documents: member.documents || []
        }));
        
        setTeam(formattedTeam);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'équipe:', error);
        setTeam([]);
      }
    };

    loadTeam();
  }, [isInitialized, currentSession, db]);

  const addMember = async (memberData: Omit<TeamMember, 'id' | 'createdAt' | 'diplomes' | 'sessionId'> & { diplomes: string }) => {
    if (!currentSession) {
      toast({
        title: "Erreur",
        description: "Aucune session active",
        variant: "destructive"
      });
      return;
    }

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

    try {
      await db.save('animateurs', member);
      
      const formattedMember: TeamMember = {
        id: String(member.id),
        sessionId: member.sessionId,
        nom: member.nom,
        prenom: member.prenom,
        age: member.age,
        telephone: member.telephone,
        email: member.email,
        role: member.role,
        diplomes: member.formations,
        notes: member.notes,
        createdAt: new Date().toISOString(),
        documents: member.documents
      };

      setTeam(prev => [...prev, formattedMember]);

      toast({
        title: "Membre ajouté",
        description: `${memberData.prenom} ${memberData.nom} a été ajouté à l'équipe`
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du membre",
        variant: "destructive"
      });
    }
  };

  const updateMember = async (updatedMember: TeamMember) => {
    if (!currentSession) return;

    try {
      const dbMember = {
        id: parseInt(updatedMember.id),
        sessionId: currentSession.id,
        nom: updatedMember.nom,
        prenom: updatedMember.prenom,
        age: updatedMember.age,
        telephone: updatedMember.telephone,
        email: updatedMember.email,
        role: updatedMember.role,
        formations: updatedMember.diplomes,
        documents: updatedMember.documents || [],
        notes: updatedMember.notes
      };

      await db.save('animateurs', dbMember);
      setTeam(prev => prev.map(member => 
        member.id === updatedMember.id ? updatedMember : member
      ));
      
      toast({
        title: "Membre mis à jour",
        description: "Les informations ont été mises à jour avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!currentSession) return;

    try {
      await db.delete('animateurs', parseInt(memberId));
      setTeam(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: "Membre supprimé",
        description: "Le membre a été supprimé de l'équipe"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const addDocument = (memberId: string, file: File) => {
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

      const updatedTeam = team.map(member => 
        member.id === memberId 
          ? { ...member, documents: [...(member.documents || []), newDocument] }
          : member
      );
      
      setTeam(updatedTeam);
      
      // Update in database
      const memberToUpdate = updatedTeam.find(m => m.id === memberId);
      if (memberToUpdate) {
        await updateMember(memberToUpdate);
      }
      
      toast({
        title: "Document ajouté",
        description: `${file.name} a été ajouté avec succès`
      });
    };
    
    reader.readAsDataURL(file);
  };

  const deleteDocument = async (memberId: string, documentId: string) => {
    const updatedTeam = team.map(member => 
      member.id === memberId 
        ? { ...member, documents: member.documents?.filter(doc => doc.id !== documentId) || [] }
        : member
    );
    
    setTeam(updatedTeam);
    
    // Update in database
    const memberToUpdate = updatedTeam.find(m => m.id === memberId);
    if (memberToUpdate) {
      await updateMember(memberToUpdate);
    }
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  };

  const downloadDocument = (document: TeamDocument) => {
    try {
      if (document.data) {
        const link = window.document.createElement('a');
        link.href = document.data;
        link.download = document.name;
        link.style.display = 'none';
        
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        
        toast({
          title: "Téléchargement démarré",
          description: `${document.name} est en cours de téléchargement`
        });
      } else {
        toast({
          title: "Erreur",
          description: "Aucune donnée disponible pour ce document",
          variant: "destructive"
        });
      }
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
