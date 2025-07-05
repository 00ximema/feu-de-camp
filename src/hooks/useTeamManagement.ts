
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    const savedTeam = localStorage.getItem('team-members');
    if (savedTeam) {
      try {
        setTeam(JSON.parse(savedTeam));
      } catch (error) {
        console.error('Erreur lors du chargement de l\'équipe:', error);
      }
    }
  }, []);

  const saveTeam = (updatedTeam: TeamMember[]) => {
    localStorage.setItem('team-members', JSON.stringify(updatedTeam));
    setTeam(updatedTeam);
  };

  const addMember = (memberData: Omit<TeamMember, 'id' | 'createdAt' | 'diplomes'> & { diplomes: string }) => {
    const member: TeamMember = {
      ...memberData,
      id: Date.now().toString(),
      nom: memberData.nom.toUpperCase(),
      diplomes: memberData.diplomes.split(',').map(d => d.trim()).filter(d => d),
      createdAt: new Date().toISOString()
    };

    const updatedTeam = [...team, member];
    saveTeam(updatedTeam);

    toast({
      title: "Membre ajouté",
      description: `${memberData.prenom} ${memberData.nom} a été ajouté à l'équipe`
    });
  };

  const updateMember = (updatedMember: TeamMember) => {
    const updatedTeam = team.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    );
    saveTeam(updatedTeam);
    toast({
      title: "Membre mis à jour",
      description: "Les informations ont été mises à jour avec succès"
    });
  };

  const deleteMember = (memberId: string) => {
    const updatedTeam = team.filter(member => member.id !== memberId);
    saveTeam(updatedTeam);
    toast({
      title: "Membre supprimé",
      description: "Le membre a été supprimé de l'équipe"
    });
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
    reader.onload = (e) => {
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
      
      saveTeam(updatedTeam);
      
      toast({
        title: "Document ajouté",
        description: `${file.name} a été ajouté avec succès`
      });
    };
    
    reader.readAsDataURL(file);
  };

  const deleteDocument = (memberId: string, documentId: string) => {
    const updatedTeam = team.map(member => 
      member.id === memberId 
        ? { ...member, documents: member.documents?.filter(doc => doc.id !== documentId) || [] }
        : member
    );
    
    saveTeam(updatedTeam);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  };

  const downloadDocument = (document: TeamDocument) => {
    try {
      if (document.data) {
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
