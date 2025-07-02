
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, AlertTriangle, Clock, User, Calendar, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import TraitementForm from "@/components/TraitementForm";
import { useJeunes } from "@/hooks/useJeunes";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";

interface FicheMedicale {
  id: number;
  nomJeune: string;
  age: number;
  allergies: string[];
  medicaments: string[];
  problemesSante: string[];
  contactUrgence: string;
  dateCreation: string;
  incidents: Incident[];
}

interface Incident {
  id: number;
  date: string;
  heure: string;
  type: 'blessure' | 'malaise' | 'medicament' | 'allergie';
  description: string;
  traitementDonne: string;
  animateurPresent: string;
}

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
  const [fichesMedicales, setFichesMedicales] = useState<FicheMedicale[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<number | null>(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showTraitementForm, setShowTraitementForm] = useState(false);
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const { toast } = useToast();
  const { jeunes } = useJeunes();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  const [incidentForm, setIncidentForm] = useState({
    type: '' as 'blessure' | 'malaise' | 'medicament' | 'allergie' | '',
    description: '',
    traitementDonne: '',
    animateurPresent: ''
  });

  // Créer automatiquement les fiches médicales depuis les jeunes importés
  useEffect(() => {
    if (jeunes.length > 0) {
      const newFiches = jeunes.map((jeune, index) => ({
        id: parseInt(jeune.id) || index,
        nomJeune: `${jeune.prenom} ${jeune.nom}`,
        age: jeune.age,
        allergies: jeune.allergies || [],
        medicaments: jeune.medicaments || [],
        problemesSante: jeune.problemesSante || [],
        contactUrgence: jeune.contactUrgence || '',
        dateCreation: jeune.dateInscription || new Date().toLocaleDateString('fr-FR'),
        incidents: []
      }));
      setFichesMedicales(newFiches);
    }
  }, [jeunes]);

  // Charger les incidents depuis localStorage
  useEffect(() => {
    const savedFiches = localStorage.getItem('fiches-medicales');
    if (savedFiches) {
      const fichesSaved = JSON.parse(savedFiches);
      setFichesMedicales(prev => {
        return prev.map(fiche => {
          const savedFiche = fichesSaved.find((f: any) => f.id === fiche.id);
          return savedFiche ? { ...fiche, incidents: savedFiche.incidents || [] } : fiche;
        });
      });
    }
  }, []);

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

  useEffect(() => {
    if (fichesMedicales.length > 0) {
      localStorage.setItem('fiches-medicales', JSON.stringify(fichesMedicales));
    }
  }, [fichesMedicales.map(f => f.incidents).flat().length]);

  const addIncident = () => {
    if (!selectedFiche || !incidentForm.type || !incidentForm.description) return;

    const newIncident: Incident = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: incidentForm.type as any,
      description: incidentForm.description,
      traitementDonne: incidentForm.traitementDonne,
      animateurPresent: incidentForm.animateurPresent
    };

    setFichesMedicales(prev => prev.map(fiche => 
      fiche.id === selectedFiche 
        ? { ...fiche, incidents: [...fiche.incidents, newIncident] }
        : fiche
    ));

    setIncidentForm({
      type: '',
      description: '',
      traitementDonne: '',
      animateurPresent: ''
    });
    setShowIncidentForm(false);

    toast({
      title: "Incident enregistré",
      description: "L'incident médical a été ajouté au dossier du jeune"
    });
  };

  const handleTraitementAdded = async () => {
    if (!isInitialized || !currentSession) return;
    
    try {
      const dbTraitements = await db.getAll('traitements', currentSession.id);
      setTraitements(dbTraitements);
    } catch (error) {
      console.error('Erreur lors du rechargement des traitements:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blessure': return 'bg-red-100 text-red-800';
      case 'malaise': return 'bg-orange-100 text-orange-800';
      case 'medicament': return 'bg-blue-100 text-blue-800';
      case 'allergie': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTraitementsActifs = () => {
    const today = new Date().toISOString().split('T')[0];
    return traitements.filter(t => t.dateDebut <= today && t.dateFin >= today);
  };

  const selectedFicheData = fichesMedicales.find(f => f.id === selectedFiche);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des fiches médicales */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fiches médicales</CardTitle>
                    <CardDescription>
                      {fichesMedicales.length} fiche(s) médicale(s)
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowTraitementForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Pill className="h-4 w-4 mr-2" />
                    Nouveau traitement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fichesMedicales.map((fiche) => (
                    <div
                      key={fiche.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFiche === fiche.id 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFiche(fiche.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">{fiche.nomJeune}</div>
                          <div className="text-gray-600">{fiche.age} ans</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fiche.allergies.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {fiche.allergies.length} allergie(s)
                              </Badge>
                            )}
                            {fiche.medicaments.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {fiche.medicaments.length} médicament(s)
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {fiche.incidents.length} incident(s)
                          </div>
                          <div className="text-sm text-gray-500">{fiche.dateCreation}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {fichesMedicales.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune fiche médicale</p>
                      <p className="text-sm">Les fiches se créent automatiquement lors de l'import des jeunes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Traitements actifs */}
            {traitementsActifs.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-blue-600" />
                    <span>Traitements en cours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {traitementsActifs.map((traitement) => (
                      <div key={traitement.id} className="p-3 border rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{traitement.jeuneNom}</div>
                            <div className="text-sm text-gray-600">{traitement.medicament}</div>
                            <div className="text-xs text-gray-500">{traitement.posologie}</div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div>Du {new Date(traitement.dateDebut).toLocaleDateString('fr-FR')}</div>
                            <div>au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Détails et incidents */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Suivi médical</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFicheData ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-lg">{selectedFicheData.nomJeune}</div>
                      <div className="text-gray-600">{selectedFicheData.age} ans</div>
                    </div>

                    {/* Informations médicales */}
                    {(selectedFicheData.allergies.length > 0 || selectedFicheData.medicaments.length > 0) && (
                      <div>
                        <h4 className="font-medium mb-2">Informations importantes</h4>
                        {selectedFicheData.allergies.length > 0 && (
                          <div className="mb-2">
                            <div className="text-sm font-medium text-red-600">Allergies :</div>
                            <div className="text-sm">{selectedFicheData.allergies.join(', ')}</div>
                          </div>
                        )}
                        {selectedFicheData.medicaments.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-blue-600">Médicaments :</div>
                            <div className="text-sm">{selectedFicheData.medicaments.join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formulaire d'incident */}
                    <div>
                      <Button 
                        onClick={() => setShowIncidentForm(!showIncidentForm)}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Signaler un incident
                      </Button>
                    </div>

                    {showIncidentForm && (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <div className="space-y-3">
                          <div>
                            <Label>Type d'incident</Label>
                            <select 
                              className="w-full p-2 border rounded"
                              value={incidentForm.type}
                              onChange={(e) => setIncidentForm(prev => ({ ...prev, type: e.target.value as any }))}
                            >
                              <option value="">Sélectionner</option>
                              <option value="blessure">Blessure</option>
                              <option value="malaise">Malaise</option>
                              <option value="medicament">Prise de médicament</option>
                              <option value="allergie">Réaction allergique</option>
                            </select>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={incidentForm.description}
                              onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Décrire l'incident..."
                            />
                          </div>
                          <div>
                            <Label>Traitement donné</Label>
                            <Input
                              value={incidentForm.traitementDonne}
                              onChange={(e) => setIncidentForm(prev => ({ ...prev, traitementDonne: e.target.value }))}
                              placeholder="Soins prodigués..."
                            />
                          </div>
                          <div>
                            <Label>Animateur présent</Label>
                            <Input
                              value={incidentForm.animateurPresent}
                              onChange={(e) => setIncidentForm(prev => ({ ...prev, animateurPresent: e.target.value }))}
                              placeholder="Nom de l'animateur"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button onClick={addIncident} size="sm">Enregistrer</Button>
                            <Button variant="outline" onClick={() => setShowIncidentForm(false)} size="sm">
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Historique des incidents */}
                    {selectedFicheData.incidents.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Historique des incidents</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedFicheData.incidents.map((incident) => (
                            <div key={incident.id} className="p-3 border rounded text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <Badge className={getTypeColor(incident.type)}>
                                  {incident.type}
                                </Badge>
                                <div className="text-xs text-gray-500">
                                  {incident.date} à {incident.heure}
                                </div>
                              </div>
                              <div className="font-medium mb-1">{incident.description}</div>
                              {incident.traitementDonne && (
                                <div className="text-gray-600">
                                  Traitement: {incident.traitementDonne}
                                </div>
                              )}
                              {incident.animateurPresent && (
                                <div className="text-xs text-gray-500">
                                  Par: {incident.animateurPresent}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sélectionnez une fiche pour voir les détails</p>
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
        onTraitementAdded={handleTraitementAdded}
      />
    </div>
  );
};

export default Infirmerie;
