
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Pill, Clock, Trash2, Stethoscope, Bandage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import TraitementForm from "@/components/TraitementForm";
import SoinForm from "@/components/SoinForm";
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

interface Soin {
  id: string;
  jeuneId: string;
  jeuneNom: string;
  type: 'soin' | 'consultation' | 'autre';
  titre: string;
  description: string;
  date: string;
  heure: string;
  soignant?: string;
  symptomes?: string;
  diagnostic?: string;
  traitement?: string;
  suivi?: boolean;
  dateCreation: string;
}

const Infirmerie = () => {
  const [showTraitementForm, setShowTraitementForm] = useState(false);
  const [showSoinForm, setShowSoinForm] = useState(false);
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const [soins, setSoins] = useState<Soin[]>([]);
  const { toast } = useToast();
  const { jeunes } = useJeunes();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les données depuis la base de données
  useEffect(() => {
    const loadData = async () => {
      if (!isInitialized || !currentSession) return;
      
      try {
        const dbTraitements = await db.getAll('traitements', currentSession.id);
        const dbSoins = await db.getAll('soins', currentSession.id);
        setTraitements(dbTraitements);
        setSoins(dbSoins);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();
  }, [isInitialized, db, currentSession]);

  const handleDataUpdated = async () => {
    if (!isInitialized || !currentSession) return;
    
    try {
      const dbTraitements = await db.getAll('traitements', currentSession.id);
      const dbSoins = await db.getAll('soins', currentSession.id);
      setTraitements(dbTraitements);
      setSoins(dbSoins);
    } catch (error) {
      console.error('Erreur lors du rechargement des données:', error);
    }
  };

  const handleDeleteTraitement = async (traitement: Traitement) => {
    if (!isInitialized || !currentSession) return;
    
    try {
      await db.delete('traitements', traitement.id);
      await handleDataUpdated();
      
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

  const handleDeleteSoin = async (soin: Soin) => {
    if (!isInitialized || !currentSession) return;
    
    try {
      await db.delete('soins', soin.id);
      await handleDataUpdated();
      
      toast({
        title: `${soin.type === 'soin' ? 'Soin' : 'Consultation'} supprimé${soin.type === 'consultation' ? 'e' : ''}`,
        description: `${soin.titre} pour ${soin.jeuneNom} a été supprimé${soin.type === 'consultation' ? 'e' : ''}`
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du soin:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le ${soin.type}`,
        variant: "destructive"
      });
    }
  };

  const getTraitementsActifs = () => {
    const today = new Date().toISOString().split('T')[0];
    return traitements.filter(t => t.dateDebut <= today && t.dateFin >= today);
  };

  const getSoinsRecents = () => {
    return soins
      .sort((a, b) => new Date(`${b.date} ${b.heure}`).getTime() - new Date(`${a.date} ${a.heure}`).getTime())
      .slice(0, 10);
  };

  const traitementsActifs = getTraitementsActifs();
  const soinsRecents = getSoinsRecents();

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
          {/* Boutons d'actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Gérez les traitements médicaux et les soins des jeunes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setShowTraitementForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Ajouter un traitement
                </Button>
                <Button 
                  onClick={() => setShowSoinForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Ajouter un soin/consultation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Soins et consultations récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bandage className="h-5 w-5 text-green-600" />
                <span>Soins et consultations récents</span>
                <Badge variant="secondary">{soinsRecents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {soinsRecents.length > 0 ? (
                <div className="space-y-3">
                  {soinsRecents.map((soin) => (
                    <div key={soin.id} className="p-4 border rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={soin.type === 'consultation' ? 'default' : 'secondary'}>
                              {soin.type === 'consultation' ? 'Consultation' : 'Soin'}
                            </Badge>
                            <span className="font-medium text-lg">{soin.jeuneNom}</span>
                          </div>
                          <div className="text-green-700 font-medium">{soin.titre}</div>
                          <div className="text-sm text-gray-600 mt-1">{soin.description}</div>
                          {soin.soignant && (
                            <div className="text-xs text-gray-500 mt-1">
                              Soignant: {soin.soignant}
                            </div>
                          )}
                          {soin.suivi && (
                            <div className="text-xs text-orange-700 font-medium mt-1">
                              ⚠️ Nécessite un suivi
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(soin.date).toLocaleDateString('fr-FR')} à {soin.heure}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSoin(soin)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bandage className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Aucun soin ou consultation enregistré</p>
                </div>
              )}
            </CardContent>
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

          {/* Message si aucune donnée */}
          {traitementsActifs.length === 0 && soinsRecents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 text-lg">Aucune donnée médicale enregistrée</p>
                <p className="text-gray-400 text-sm">Commencez par ajouter un traitement ou un soin</p>
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
        onTraitementAdded={handleDataUpdated}
      />

      <SoinForm 
        isOpen={showSoinForm}
        onClose={() => setShowSoinForm(false)}
        jeunes={jeunes}
        selectedJeuneId={null}
        onSoinAdded={handleDataUpdated}
      />
    </div>
  );
};

export default Infirmerie;
