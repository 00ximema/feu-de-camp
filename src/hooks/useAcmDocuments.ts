import { useState, useEffect } from 'react';
import { useLocalDatabase } from './useLocalDatabase';
import { useSession } from './useSession';
import { useToast } from './use-toast';
import { AcmDocument } from '@/components/acm/AcmDocumentManager';

export const useAcmDocuments = () => {
  const [acmDocuments, setAcmDocuments] = useState<AcmDocument[]>([]);
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (currentSession) {
      loadAcmDocuments();
    }
  }, [currentSession]);

  const loadAcmDocuments = async () => {
    if (!currentSession) return;

    try {
      const storedDocuments = localStorage.getItem(`acmDocuments_${currentSession.id}`);
      if (storedDocuments) {
        setAcmDocuments(JSON.parse(storedDocuments));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents ACM:', error);
    }
  };

  const addDocument = async (file: File, documentType: string): Promise<void> => {
    if (!currentSession) return;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const newDocument: AcmDocument = {
            id: `acm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            documentType,
            uploadDate: new Date().toISOString(),
            data: e.target?.result as string
          };

          const updatedDocuments = [...acmDocuments, newDocument];
          setAcmDocuments(updatedDocuments);
          
          // Sauvegarder dans le localStorage
          localStorage.setItem(`acmDocuments_${currentSession.id}`, JSON.stringify(updatedDocuments));

          toast({
            title: "Document ajouté",
            description: `${file.name} a été ajouté avec succès`
          });

          resolve();
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du document:', error);
          toast({
            title: "Erreur",
            description: "Impossible d'ajouter le document",
            variant: "destructive"
          });
          reject(error);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Erreur",
          description: "Impossible de lire le fichier",
          variant: "destructive"
        });
        reject(new Error('Erreur de lecture du fichier'));
      };

      reader.readAsDataURL(file);
    });
  };

  const deleteDocument = async (documentId: string): Promise<void> => {
    if (!currentSession) return;

    try {
      const updatedDocuments = acmDocuments.filter(doc => doc.id !== documentId);
      setAcmDocuments(updatedDocuments);
      localStorage.setItem(`acmDocuments_${currentSession.id}`, JSON.stringify(updatedDocuments));

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const downloadDocument = (document: AcmDocument): void => {
    if (!document.data) {
      toast({
        title: "Erreur",
        description: "Données du document non disponibles",
        variant: "destructive"
      });
      return;
    }

    try {
      const link = window.document.createElement('a');
      link.href = document.data;
      link.download = document.name;
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
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  return {
    acmDocuments,
    addDocument,
    deleteDocument,
    downloadDocument
  };
};