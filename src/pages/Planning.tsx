import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Plus, Users, MapPin, Edit, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import PlanningTableGenerator from "@/components/PlanningTableGenerator";

interface Activite {
  id: number;
  nom: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu: string;
  animateurs: string[];
  groupes: string[];
  materiel: string[];
  description: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
}

interface CreneauHoraire {
  heure: string;
  activites: Activite[];
}

const Planning = () => {
  const [activites, setActivites] = useState<Activite[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingActivite, setEditingActivite] = useState<number | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "",
    date: "",
    heureDebut: "",
    heureFin: "",
    lieu: "",
    animateurs: "",
    groupes: "",
    materiel: "",
    description: ""
  });

  useEffect(() => {
    const savedActivites = localStorage.getItem('planning-activites');
    if (savedActivites) {
      setActivites(JSON.parse(savedActivites));
    } else {
      // Données d'exemple
      const exempleActivites: Activite[] = [
        {
          id: 1,
          nom: "Accueil des enfants",
          date: new Date().toISOString().split('T')[0],
          heureDebut: "08:00",
          heureFin: "09:00",
          lieu: "Hall d'accueil",
          animateurs: ["Marie Dupont", "Pierre Martin"],
          groupes: ["Tous"],
          materiel: [],
          description: "Accueil échelonné des enfants",
          statut: 'planifie'
        },
        {
          id: 2,
          nom: "Jeux coopératifs",
          date: new Date().toISOString().split('T')[0],
          heureDebut: "09:30",
          heureFin: "10:30",
          lieu: "Salle de jeux",
          animateurs: ["Lucas Moreau"],
          groupes: ["6-8 ans"],
          materiel: ["Parachute", "Balles"],
          description: "Activités de coopération pour les plus jeunes",
          statut: 'planifie'
        }
      ];
      setActivites(exempleActivites);
      localStorage.setItem('planning-activites', JSON.stringify(exempleActivites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('planning-activites', JSON.stringify(activites));
  }, [activites]);

  const addOrUpdateActivite = () => {
    const activiteData = {
      nom: form.nom,
      date: form.date,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      lieu: form.lieu,
      animateurs: form.animateurs.split(',').map(a => a.trim()).filter(a => a),
      groupes: form.groupes.split(',').map(g => g.trim()).filter(g => g),
      materiel: form.materiel.split(',').map(m => m.trim()).filter(m => m),
      description: form.description,
      statut: 'planifie' as const
    };

    if (editingActivite) {
      setActivites(prev => prev.map(activite => 
        activite.id === editingActivite 
          ? { ...activite, ...activiteData }
          : activite
      ));
      toast({
        title: "Activité modifiée",
        description: `${form.nom} a été mise à jour`
      });
    } else {
      const newActivite: Activite = {
        id: Date.now(),
        ...activiteData
      };
      setActivites(prev => [...prev, newActivite]);
      toast({
        title: "Activité ajoutée",
        description: `${form.nom} a été ajoutée au planning`
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setForm({
      nom: "",
      date: "",
      heureDebut: "",
      heureFin: "",
      lieu: "",
      animateurs: "",
      groupes: "",
      materiel: "",
      description: ""
    });
    setShowForm(false);
    setEditingActivite(null);
  };

  const editActivite = (activite: Activite) => {
    setForm({
      nom: activite.nom,
      date: activite.date,
      heureDebut: activite.heureDebut,
      heureFin: activite.heureFin,
      lieu: activite.lieu,
      animateurs: activite.animateurs.join(', '),
      groupes: activite.groupes.join(', '),
      materiel: activite.materiel.join(', '),
      description: activite.description
    });
    setEditingActivite(activite.id);
    setShowForm(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-800';
      case 'en_cours': return 'bg-green-100 text-green-800';
      case 'termine': return 'bg-gray-100 text-gray-800';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'Planifié';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const activitesDuJour = activites.filter(activite => activite.date === selectedDate);
  
  const creneauxHoraires: CreneauHoraire[] = [];
  const heures = [];
  for (let h = 8; h <= 18; h++) {
    heures.push(`${h.toString().padStart(2, '0')}:00`);
    heures.push(`${h.toString().padStart(2, '0')}:30`);
  }

  heures.forEach(heure => {
    const activitesACetteHeure = activitesDuJour.filter(activite => 
      heure >= activite.heureDebut && heure < activite.heureFin
    );
    creneauxHoraires.push({
      heure,
      activites: activitesACetteHeure
    });
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Retour accueil</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activities" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Planning Activités</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>Planning Tableau</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-6">
            {/* Sélecteur de date et actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      {activitesDuJour.length} activité(s) prévue(s)
                    </div>
                  </div>
                  <Button onClick={() => setShowForm(true)} disabled={showForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle activité
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Planning visuel */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Planning du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                    <CardDescription>Vue détaillée des activités</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {showForm && (
                      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-4">
                          {editingActivite ? 'Modifier l\'activité' : 'Nouvelle activité'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nom de l'activité</Label>
                            <Input
                              value={form.nom}
                              onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Lieu</Label>
                            <Input
                              value={form.lieu}
                              onChange={(e) => setForm(prev => ({ ...prev, lieu: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={form.date}
                              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Début</Label>
                              <Input
                                type="time"
                                value={form.heureDebut}
                                onChange={(e) => setForm(prev => ({ ...prev, heureDebut: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Fin</Label>
                              <Input
                                type="time"
                                value={form.heureFin}
                                onChange={(e) => setForm(prev => ({ ...prev, heureFin: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Animateurs (séparés par des virgules)</Label>
                            <Input
                              value={form.animateurs}
                              onChange={(e) => setForm(prev => ({ ...prev, animateurs: e.target.value }))}
                              placeholder="Marie Dupont, Pierre Martin..."
                            />
                          </div>
                          <div>
                            <Label>Groupes (séparés par des virgules)</Label>
                            <Input
                              value={form.groupes}
                              onChange={(e) => setForm(prev => ({ ...prev, groupes: e.target.value }))}
                              placeholder="6-8 ans, 9-12 ans..."
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-4">
                          <div>
                            <Label>Matériel nécessaire (séparé par des virgules)</Label>
                            <Input
                              value={form.materiel}
                              onChange={(e) => setForm(prev => ({ ...prev, materiel: e.target.value }))}
                              placeholder="Ballons, Cônes, Parachute..."
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={form.description}
                              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Objectifs, déroulement..."
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button onClick={addOrUpdateActivite}>
                            {editingActivite ? 'Modifier' : 'Ajouter'}
                          </Button>
                          <Button variant="outline" onClick={resetForm}>Annuler</Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {creneauxHoraires
                        .filter(creneau => creneau.activites.length > 0)
                        .map((creneau) => (
                        <div key={creneau.heure} className="flex">
                          <div className="w-16 flex-shrink-0 text-sm text-gray-500 pt-2">
                            {creneau.heure}
                          </div>
                          <div className="flex-1 space-y-1">
                            {creneau.activites.map((activite) => (
                              <div
                                key={activite.id}
                                className="p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
                                onClick={() => editActivite(activite)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="font-medium">{activite.nom}</div>
                                      <Badge className={getStatutColor(activite.statut)}>
                                        {getStatutLabel(activite.statut)}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      <div className="flex items-center space-x-4">
                                        <span className="flex items-center space-x-1">
                                          <Clock className="h-3 w-3" />
                                          <span>{activite.heureDebut} - {activite.heureFin}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <MapPin className="h-3 w-3" />
                                          <span>{activite.lieu}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <Users className="h-3 w-3" />
                                          <span>{activite.groupes.join(', ')}</span>
                                        </span>
                                      </div>
                                    </div>
                                    {activite.animateurs.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {activite.animateurs.map((animateur, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {animateur}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Edit className="h-4 w-4 text-gray-400" />
                                </div>
                                {activite.description && (
                                  <div className="text-sm text-gray-500 mt-2">
                                    {activite.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {activitesDuJour.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Aucune activité prévue ce jour</p>
                          <p className="text-sm">Cliquez sur "Nouvelle activité" pour commencer</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Résumé et statistiques */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Résumé</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {activitesDuJour.length}
                        </div>
                        <div className="text-sm text-gray-600">Activités prévues</div>
                      </div>

                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {new Set(activitesDuJour.flatMap(a => a.animateurs)).size}
                        </div>
                        <div className="text-sm text-gray-600">Animateurs mobilisés</div>
                      </div>

                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {new Set(activitesDuJour.flatMap(a => a.groupes)).size}
                        </div>
                        <div className="text-sm text-gray-600">Groupes différents</div>
                      </div>

                      {activitesDuJour.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Prochaines activités</h4>
                          <div className="space-y-2">
                            {activitesDuJour
                              .filter(a => a.heureDebut > new Date().toTimeString().slice(0, 5))
                              .slice(0, 3)
                              .map((activite) => (
                              <div key={activite.id} className="text-sm">
                                <div className="font-medium">{activite.nom}</div>
                                <div className="text-gray-500">{activite.heureDebut} • {activite.lieu}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="table">
            <PlanningTableGenerator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Planning;
