
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Upload, Search, UserPlus, AlertCircle, FileText, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import YoungsterCard from "@/components/YoungsterCard";
import YoungsterDetailsModal from "@/components/YoungsterDetailsModal";
import { parseExcel } from "@/utils/excelParser";
import { Youngster } from "@/types/youngster";
import { useJeunes } from "@/hooks/useJeunes";
import { useEvents } from "@/hooks/useEvents";

const Jeunes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYoungster, setSelectedYoungster] = useState<Youngster | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedYoungsterForEvent, setSelectedYoungsterForEvent] = useState<Youngster | null>(null);
  const { toast } = useToast();
  const { jeunes, addJeune, addMultipleJeunes, updateJeune, deleteJeune, isInitialized } = useJeunes();
  const { events, addEvent } = useEvents();

  const [newYoungster, setNewYoungster] = useState({
    nom: "",
    prenom: "",
    age: "",
    telephone: "",
    email: "",
    adresse: "",
    allergies: "",
    medicaments: "",
    notes: ""
  });

  const [newEvent, setNewEvent] = useState({
    type: "",
    description: ""
  });

  const filteredYoungsters = jeunes.filter(
    (youngster) =>
      youngster.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      youngster.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddYoungster = async () => {
    if (!newYoungster.nom || !newYoungster.prenom || !newYoungster.age) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom, prénom et âge",
        variant: "destructive"
      });
      return;
    }

    const youngsterData = {
      nom: newYoungster.nom,
      prenom: newYoungster.prenom,
      age: parseInt(newYoungster.age),
      telephone: newYoungster.telephone,
      email: newYoungster.email,
      adresse: newYoungster.adresse,
      allergies: newYoungster.allergies.split(',').map(a => a.trim()).filter(a => a),
      medicaments: newYoungster.medicaments.split(',').map(m => m.trim()).filter(m => m),
      notes: newYoungster.notes
    };

    const result = await addJeune(youngsterData);
    if (result) {
      toast({
        title: "Jeune ajouté",
        description: `${newYoungster.prenom} ${newYoungster.nom} a été ajouté avec succès`
      });
      
      setNewYoungster({
        nom: "",
        prenom: "",
        age: "",
        telephone: "",
        email: "",
        adresse: "",
        allergies: "",
        medicaments: "",
        notes: ""
      });
      setShowAddForm(false);
    }
  };

  const handleUpdateYoungster = async (id: string, updates: Partial<Youngster>) => {
    const result = await updateJeune(id, updates);
    if (result) {
      toast({
        title: "Jeune mis à jour",
        description: "Les informations ont été mises à jour avec succès"
      });
    }
  };

  const handleDeleteYoungster = async (id: string) => {
    const result = await deleteJeune(id);
    if (result) {
      toast({
        title: "Jeune supprimé",
        description: "Le jeune a été supprimé avec succès"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const youngsters = await parseExcel(file);
      const result = await addMultipleJeunes(youngsters);
      
      if (result.length > 0) {
        toast({
          title: "Import réussi",
          description: `${result.length} jeunes ont été importés avec succès`
        });
        setShowImportDialog(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le fichier. Vérifiez le format.",
        variant: "destructive"
      });
    }
  };

  const handleAddEvent = async () => {
    if (!selectedYoungsterForEvent || !newEvent.type || !newEvent.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const result = await addEvent(
      selectedYoungsterForEvent.id,
      `${selectedYoungsterForEvent.prenom} ${selectedYoungsterForEvent.nom}`,
      newEvent.type,
      newEvent.description
    );

    if (result) {
      toast({
        title: "Événement ajouté",
        description: "L'événement a été enregistré avec succès"
      });
      setNewEvent({ type: "", description: "" });
      setSelectedYoungsterForEvent(null);
      setShowEventDialog(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de la base de données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Jeunes</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Retour accueil</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section principale - Liste des jeunes */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Liste des jeunes ({jeunes.length})</span>
                    </CardTitle>
                    <CardDescription>Gérez les informations des jeunes participants</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un jeune</DialogTitle>
                          <DialogDescription>
                            Ajoutez un nouveau jeune participant
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="nom">Nom</Label>
                              <Input
                                id="nom"
                                value={newYoungster.nom}
                                onChange={(e) => setNewYoungster({ ...newYoungster, nom: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="prenom">Prénom</Label>
                              <Input
                                id="prenom"
                                value={newYoungster.prenom}
                                onChange={(e) => setNewYoungster({ ...newYoungster, prenom: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="age">Âge</Label>
                            <Input
                              id="age"
                              type="number"
                              value={newYoungster.age}
                              onChange={(e) => setNewYoungster({ ...newYoungster, age: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="telephone">Téléphone</Label>
                            <Input
                              id="telephone"
                              value={newYoungster.telephone}
                              onChange={(e) => setNewYoungster({ ...newYoungster, telephone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newYoungster.email}
                              onChange={(e) => setNewYoungster({ ...newYoungster, email: e.target.value })}
                            />
                          </div>
                          <Button 
                            className="w-full"
                            disabled={!newYoungster.nom || !newYoungster.prenom || !newYoungster.age}
                            onClick={handleAddYoungster}
                          >
                            Ajouter le jeune
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Importer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Importer depuis Excel</DialogTitle>
                          <DialogDescription>
                            Importez une liste de jeunes depuis un fichier Excel
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <Input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleFileUpload}
                              className="max-w-xs mx-auto"
                            />
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-sm text-blue-700">
                                  Le fichier doit contenir : Nom, Prénom, Age, Téléphone, Email, Adresse
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par nom ou prénom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Badge variant="outline">
                    {filteredYoungsters.length} résultat{filteredYoungsters.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {filteredYoungsters.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun jeune trouvé</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ? "Aucun résultat pour votre recherche" : "Commencez par ajouter des jeunes"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredYoungsters.map((youngster) => (
                      <div key={youngster.id} className="relative">
                        <YoungsterCard
                          youngster={youngster}
                          onClick={() => setSelectedYoungster(youngster)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedYoungsterForEvent(youngster);
                            setShowEventDialog(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section latérale - Journal des événements */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Journal des événements</span>
                </CardTitle>
                <CardDescription>
                  Historique des événements récents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucun événement enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.slice(-10).reverse().map((event) => (
                      <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="secondary">{event.type}</Badge>
                          <span className="text-xs text-gray-500">{event.date}</span>
                        </div>
                        <p className="font-medium text-sm">{event.youngsterName}</p>
                        <p className="text-gray-600 text-sm">{event.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog pour ajouter un événement */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un événement</DialogTitle>
              <DialogDescription>
                {selectedYoungsterForEvent && 
                  `Ajouter un événement pour ${selectedYoungsterForEvent.prenom} ${selectedYoungsterForEvent.nom}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventType">Type d'événement</Label>
                <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Incident">Incident</SelectItem>
                    <SelectItem value="Santé">Santé</SelectItem>
                    <SelectItem value="Comportement">Comportement</SelectItem>
                    <SelectItem value="Activité">Activité</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eventDescription">Description</Label>
                <textarea
                  id="eventDescription"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez l'événement..."
                />
              </div>
              <Button 
                className="w-full"
                disabled={!newEvent.type || !newEvent.description}
                onClick={handleAddEvent}
              >
                Ajouter l'événement
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedYoungster && (
          <YoungsterDetailsModal
            youngster={selectedYoungster}
            isOpen={!!selectedYoungster}
            onClose={() => setSelectedYoungster(null)}
            onUpdate={handleUpdateYoungster}
          />
        )}
      </main>
    </div>
  );
};

export default Jeunes;
