
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Pill, Clock } from "lucide-react";
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
  dateCreation: string;
}

const Infirmerie = () => {
  const [selectedJeune, setSelectedJeune] = useState<string | null>(null);
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

  const getTraitementsActifs = () => {
    const today = new Date().toISOString().split('T')[0];
    return traitements.filter(t => t.dateDebut <= today && t.dateFin >= today);
  };

  const getTraitementsForJeune = (jeuneId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return traitements.filter(t => 
      t.jeuneId === jeuneId && 
      t.dateDebut <= today && 
      t.dateFin >= today
    );
  };

  const selectedJeuneData = jeunes.find(j => j.id === selectedJeune);
  const traitementsActifs = getTraitementsActifs();

  const handleAddTraitement = () => {
    if (!selectedJeune) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sélectionner un jeune",
        variant: "destructive"
      });
      return;
    }
    setShowTraitementForm(true);
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des jeunes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sélectionner un jeune</CardTitle>
                    <CardDescription>
                      Choisissez un jeune pour lui ajouter un traitement
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jeunes.map((jeune) => {
                    const jeuneTraitements = getTraitementsForJeune(jeune.id);
                    return (
                      <div
                        key={jeune.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedJeune === jeune.id 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedJeune(jeune.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-lg">{jeune.prenom} {jeune.nom}</div>
                            <div className="text-gray-600">{jeune.age} ans</div>
                            {jeuneTraitements.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge className="text-xs bg-blue-100 text-blue-800">
                                  <Pill className="h-3 w-3 mr-1" />
                                  {jeuneTraitements.length} traitement(s) actif(s)
                                </Badge>
                              </div>
                            )}
                            {jeuneTraitements.length > 0 && (
                              <div className="mt-2 text-xs text-blue-600">
                                {jeuneTraitements.map(t => t.medicament).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {jeunes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun jeune trouvé</p>
                      <p className="text-sm">Importez d'abord des jeunes dans la section correspondante</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aperçu rapide des traitements actifs */}
            {traitementsActifs.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-blue-600" />
                    <span>Traitements en cours</span>
                    <Badge variant="secondary">{traitementsActifs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {traitementsActifs.map((traitement) => (
                      <div key={traitement.id} className="p-3 border rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{traitement.jeuneNom}</div>
                            <div className="text-sm text-blue-700 font-medium">{traitement.medicament}</div>
                            <div className="text-xs text-gray-600 mt-1">{traitement.posologie}</div>
                            {traitement.instructions && (
                              <div className="text-xs text-gray-500 mt-1 italic">
                                {traitement.instructions}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-xs text-gray-500 ml-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Jusqu'au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions pour le jeune sélectionné */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5" />
                  <span>Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedJeuneData ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-lg">{selectedJeuneData.prenom} {selectedJeuneData.nom}</div>
                      <div className="text-gray-600">{selectedJeuneData.age} ans</div>
                    </div>

                    {/* Traitements actifs pour ce jeune */}
                    {(() => {
                      const jeuneTraitements = getTraitementsForJeune(selectedJeuneData.id);
                      return jeuneTraitements.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center space-x-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            <span>Traitements en cours</span>
                          </h4>
                          <div className="space-y-2">
                            {jeuneTraitements.map((traitement) => (
                              <div key={traitement.id} className="p-2 border rounded bg-blue-50 text-sm">
                                <div className="font-medium text-blue-700">{traitement.medicament}</div>
                                <div className="text-gray-600">{traitement.posologie}</div>
                                <div className="text-xs text-gray-500">
                                  Jusqu'au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bouton pour ajouter un traitement */}
                    <div>
                      <Button 
                        onClick={handleAddTraitement}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un traitement
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sélectionnez un jeune pour ajouter un traitement</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <TraitementForm 
        isOpen={showTraitementForm}
        onClose={() => setShowTraitementForm(false)}
        jeunes={jeunes}
        selectedJeuneId={selectedJeune}
        onTraitementAdded={handleTraitementAdded}
      />
    </div>
  );
};

export default Infirmerie;
