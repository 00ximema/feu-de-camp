import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Upload, Search, UserPlus, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import YoungsterCard from "@/components/YoungsterCard";
import YoungsterDetailsModal from "@/components/YoungsterDetailsModal";
import { parseExcelFile } from "@/utils/excelParser";
import { Youngster } from "@/types/youngster";
import { useJeunes } from "@/hooks/useJeunes";

const Jeunes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYoungster, setSelectedYoungster] = useState<Youngster | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const { jeunes, addJeune, addMultipleJeunes, updateJeune, deleteJeune, isInitialized } = useJeunes();

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
      const youngsters = await parseExcelFile(file);
      const result = await addMultipleJeunes(youngsters);
      
      if (result.length > 0) {
        toast({
          title: "Import réussi",
          description: `${result.length} jeunes ont été importés avec succès`
        });
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
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Liste des jeunes</TabsTrigger>
            <TabsTrigger value="add">Ajouter un jeune</TabsTrigger>
            <TabsTrigger value="import">Importer depuis Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
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
                  <Button onClick={() => setShowAddForm(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un jeune
                  </Button>
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
                    <Button onClick={() => setShowAddForm(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter le premier jeune
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredYoungsters.map((youngster) => (
                      <YoungsterCard
                        key={youngster.id}
                        youngster={youngster}
                        onEdit={(youngster) => setSelectedYoungster(youngster)}
                        onDelete={(id) => handleDeleteYoungster(id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Ajouter un jeune</span>
                </CardTitle>
                <CardDescription>
                  Ajoutez un nouveau jeune participant à la liste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      type="text"
                      value={newYoungster.nom}
                      onChange={(e) => setNewYoungster({ ...newYoungster, nom: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      type="text"
                      value={newYoungster.prenom}
                      onChange={(e) => setNewYoungster({ ...newYoungster, prenom: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="age">Âge</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newYoungster.age}
                      onChange={(e) => setNewYoungster({ ...newYoungster, age: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      type="text"
                      value={newYoungster.telephone}
                      onChange={(e) => setNewYoungster({ ...newYoungster, telephone: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newYoungster.email}
                      onChange={(e) => setNewYoungster({ ...newYoungster, email: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      type="text"
                      value={newYoungster.adresse}
                      onChange={(e) => setNewYoungster({ ...newYoungster, adresse: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input
                      id="allergies"
                      type="text"
                      value={newYoungster.allergies}
                      onChange={(e) => setNewYoungster({ ...newYoungster, allergies: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicaments">Médicaments</Label>
                    <Input
                      id="medicaments"
                      type="text"
                      value={newYoungster.medicaments}
                      onChange={(e) => setNewYoungster({ ...newYoungster, medicaments: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={newYoungster.notes}
                      onChange={(e) => setNewYoungster({ ...newYoungster, notes: e.target.value })}
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Décrivez les notes spécifiques au jeune..."
                    />
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!newYoungster.nom || !newYoungster.prenom || !newYoungster.age}
                    onClick={handleAddYoungster}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter le jeune
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Importer depuis Excel</span>
                </CardTitle>
                <CardDescription>
                  Importez une liste de jeunes depuis un fichier Excel (.xlsx, .xls)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un fichier Excel</h3>
                  <p className="text-gray-500 mb-4">
                    Le fichier doit contenir les colonnes : Nom, Prénom, Age, Téléphone, Email, Adresse, Allergies, Médicaments, Notes
                  </p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Format attendu</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Assurez-vous que votre fichier Excel contient les colonnes suivantes (dans l'ordre) :
                        Nom, Prénom, Age, Téléphone, Email, Adresse, Allergies, Médicaments, Notes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
