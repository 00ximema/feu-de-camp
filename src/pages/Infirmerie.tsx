
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Pill, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import TraitementForm from "@/components/TraitementForm";
import { useJeunes } from "@/hooks/useJeunes";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";

interface Traitement {
  id: string;
  jeuneId: string;
  jeuneNom: string;
  medicament: string;
  posologie: string;
  duree: string;
  dateDebut: string;
  dateFin: string;
  instructions?: string;
  ordonnance: boolean;
  dateCreation: string;
}

const Infirmerie = () => {
  const [showTraitementForm, setShowTraitementForm] = useState(false);
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const { toast } = useToast();
  const { jeunes } = useJeunes();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les traitements depuis la base de données
  useEffect(() => {
    const loadTraitements = async () => {
      if (!isInitialized || !currentSession) return;
      
      try {
        const dbTraitements = await db.getAll('traitements', currentSession.id);
        setTraitements(dbTraitements);
      } catch (error) {
        console.error('Erreur lors du chargement des traitements:', error);
      }
    };

    loadTraitements();
  }, [isInitialized, db, currentSession]);

  const handleTraitementAdded = async () => {
    if (!isInitialized || !currentSession) return;
    
    try {
      const dbTraitements = await db.getAll('traitements', currentSession.id);
      setTraitements(dbTraitements);
    } catch (error) {
      console.error('Erreur lors du rechargement des traitements:', error);
    }
  };

  const handleDeleteTraitement = async (traitement: Traitement) => {
    if (!isInitialized || !currentSession) return;
    
    try {
      await db.delete('traitements', traitement.id);
      const dbTraitements = await db.getAll('traitements', currentSession.id);
      setTraitements(dbTraitements);
      
      toast({
        title: "Traitement supprimé",
        description: `Le traitement ${traitement.medicament} pour ${traitement.jeuneNom} a été supprimé`
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du traitement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le traitement",
        variant: "destructive"
      });
    }
  };

  const getTraitementsActifs = () => {
    const today = new Date().toISOString().split('T')[0];
    return traitements.filter(t => t.dateDebut <= today && t.dateFin >= today);
  };

  const traitementsActifs = getTraitementsActifs();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="h-6 w-6 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Infirmerie</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Retour accueil</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Bouton pour ajouter un traitement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestion des traitements</span>
                <Button 
                  onClick={() => setShowTraitementForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un traitement
                </Button>
              </CardTitle>
              <CardDescription>
                Gérez les traitements médicaux des jeunes
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Liste des traitements actifs */}
          {traitementsActifs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  <span>Traitements en cours</span>
                  <Badge variant="secondary">{traitementsActifs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {traitementsActifs.map((traitement) => (
                    <div key={traitement.id} className="p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{traitement.jeuneNom}</div>
                          <div className="text-sm text-blue-700 font-medium mt-1">{traitement.medicament}</div>
                          <div className="text-xs text-gray-600 mt-1">{traitement.posologie}</div>
                          {traitement.ordonnance && (
                            <div className="text-xs text-green-700 font-medium mt-1 flex items-center space-x-1">
                              <span>📄 Avec ordonnance</span>
                            </div>
                          )}
                          {traitement.instructions && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              {traitement.instructions}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Jusqu'au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTraitement(traitement)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message si aucun traitement */}
          {traitementsActifs.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Pill className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 text-lg">Aucun traitement en cours</p>
                <p className="text-gray-400 text-sm">Cliquez sur "Ajouter un traitement" pour commencer</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <TraitementForm 
        isOpen={showTraitementForm}
        onClose={() => setShowTraitementForm(false)}
        jeunes={jeunes}
        selectedJeuneId={null}
        onTraitementAdded={handleTraitementAdded}
      />
    </div>
  );
};

export default Infirmerie;
