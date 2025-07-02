
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Upload, FileSpreadsheet, Search, Filter, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Youngster } from "@/types/youngster";

const Jeunes = () => {
  const [youngsters, setYoungsters] = useState<Youngster[]>([]);
  const [filteredYoungsters, setFilteredYoungsters] = useState<Youngster[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYoungster, setSelectedYoungster] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    age: "",
    ville: "",
    telephone: "",
    email: "",
    allergies: "",
    medicaments: "",
    regime: ""
  });

  useEffect(() => {
    const savedYoungsters = localStorage.getItem('imported-youngsters');
    if (savedYoungsters) {
      try {
        const parsedYoungsters = JSON.parse(savedYoungsters);
        setYoungsters(parsedYoungsters);
        setFilteredYoungsters(parsedYoungsters);
      } catch (error) {
        console.error('Erreur lors du chargement des jeunes:', error);
      }
    }
  }, []);

  useEffect(() => {
    const filtered = youngsters.filter(youngster =>
      `${youngster.prenom} ${youngster.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      youngster.ville.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredYoungsters(filtered);
  }, [searchTerm, youngsters]);

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Simulation de lecture Excel
          const mockData: Youngster[] = [
            {
              id: "1",
              nom: "Martin",
              prenom: "Lucas",
              age: 12,
              ville: "Lyon",
              telephone: "06.12.34.56.78",
              email: "lucas.martin@email.com",
              allergies: ["Arachides"],
              medicaments: [],
              regime: "Normal",
              dateInscription: new Date().toISOString().split('T')[0]
            },
            {
              id: "2", 
              nom: "Dubois",
              prenom: "Emma",
              age: 10,
              ville: "Villeurbanne",
              telephone: "06.87.65.43.21",
              email: "emma.dubois@email.com",
              allergies: [],
              medicaments: ["Ventoline"],
              regime: "Végétarien",
              dateInscription: new Date().toISOString().split('T')[0]
            }
          ];

          setYoungsters(mockData);
          setFilteredYoungsters(mockData);
          localStorage.setItem('imported-youngsters', JSON.stringify(mockData));
          
          toast({
            title: "Import réussi",
            description: `${mockData.length} jeunes importés depuis Excel`
          });
        };
        reader.readAsText(file);
      });
    }
  };

  const addYoungster = () => {
    const newYoungster: Youngster = {
      id: Date.now().toString(),
      nom: form.nom,
      prenom: form.prenom,
      age: parseInt(form.age),
      ville: form.ville,
      telephone: form.telephone,
      email: form.email,
      allergies: form.allergies.split(',').map(a => a.trim()).filter(a => a),
      medicaments: form.medicaments.split(',').map(m => m.trim()).filter(m => m),
      regime: form.regime || "Normal",
      dateInscription: new Date().toISOString().split('T')[0]
    };

    const updatedYoungsters = [...youngsters, newYoungster];
    setYoungsters(updatedYoungsters);
    setFilteredYoungsters(updatedYoungsters);
    localStorage.setItem('imported-youngsters', JSON.stringify(updatedYoungsters));

    setForm({
      nom: "",
      prenom: "",
      age: "",
      ville: "",
      telephone: "",
      email: "",
      allergies: "",
      medicaments: "",
      regime: ""
    });
    setShowForm(false);

    toast({
      title: "Jeune ajouté",
      description: `${form.prenom} ${form.nom} a été ajouté à la liste`
    });
  };

  const selectedYoungsterData = youngsters.find(y => y.id === selectedYoungster);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion des jeunes</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Retour accueil</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre d'outils */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un jeune..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowForm(true)} disabled={showForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un jeune
                </Button>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelImport}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des jeunes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Liste des jeunes ({filteredYoungsters.length})</CardTitle>
                <CardDescription>
                  Participants inscrits au centre de loisirs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">Nouveau jeune</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={form.nom}
                          onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Prénom</Label>
                        <Input
                          value={form.prenom}
                          onChange={(e) => setForm(prev => ({ ...prev, prenom: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Âge</Label>
                        <Input
                          type="number"
                          value={form.age}
                          onChange={(e) => setForm(prev => ({ ...prev, age: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Ville</Label>
                        <Input
                          value={form.ville}
                          onChange={(e) => setForm(prev => ({ ...prev, ville: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                          value={form.telephone}
                          onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label>Allergies (séparées par des virgules)</Label>
                        <Input
                          value={form.allergies}
                          onChange={(e) => setForm(prev => ({ ...prev, allergies: e.target.value }))}
                          placeholder="Arachides, Lactose..."
                        />
                      </div>
                      <div>
                        <Label>Médicaments (séparés par des virgules)</Label>
                        <Input
                          value={form.medicaments}
                          onChange={(e) => setForm(prev => ({ ...prev, medicaments: e.target.value }))}
                          placeholder="Ventoline, Ritaline..."
                        />
                      </div>
                      <div>
                        <Label>Régime alimentaire</Label>
                        <Input
                          value={form.regime}
                          onChange={(e) => setForm(prev => ({ ...prev, regime: e.target.value }))}
                          placeholder="Normal, Végétarien, Halal..."
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={addYoungster}>Ajouter</Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredYoungsters.map((youngster) => (
                    <div
                      key={youngster.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedYoungster === youngster.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedYoungster(youngster.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">
                            {youngster.prenom} {youngster.nom}
                          </div>
                          <div className="text-gray-600">
                            {youngster.age} ans • {youngster.ville}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {youngster.allergies.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                Allergies: {youngster.allergies.join(', ')}
                              </Badge>
                            )}
                            {youngster.medicaments.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Médicaments: {youngster.medicaments.join(', ')}
                              </Badge>
                            )}
                            {youngster.regime !== "Normal" && (
                              <Badge variant="outline" className="text-xs">
                                {youngster.regime}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          Inscrit le {new Date(youngster.dateInscription).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredYoungsters.length === 0 && youngsters.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun jeune inscrit</p>
                      <p className="text-sm">Importez un fichier Excel ou ajoutez manuellement</p>
                    </div>
                  )}

                  {filteredYoungsters.length === 0 && youngsters.length > 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun résultat pour "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fiche détaillée */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>Fiche du jeune</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedYoungsterData ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-lg">
                        {selectedYoungsterData.prenom} {selectedYoungsterData.nom}
                      </div>
                      <div className="text-gray-600">
                        {selectedYoungsterData.age} ans • {selectedYoungsterData.ville}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Contact</h4>
                      <div className="text-sm space-y-1">
                        <div>📞 {selectedYoungsterData.telephone}</div>
                        <div>📧 {selectedYoungsterData.email}</div>
                      </div>
                    </div>

                    {(selectedYoungsterData.allergies.length > 0 || selectedYoungsterData.medicaments.length > 0) && (
                      <div>
                        <h4 className="font-medium mb-2 text-red-600">⚠️ Informations médicales</h4>
                        {selectedYoungsterData.allergies.length > 0 && (
                          <div className="mb-2">
                            <div className="text-sm font-medium">Allergies :</div>
                            <div className="text-sm text-red-600">{selectedYoungsterData.allergies.join(', ')}</div>
                          </div>
                        )}
                        {selectedYoungsterData.medicaments.length > 0 && (
                          <div>
                            <div className="text-sm font-medium">Médicaments :</div>
                            <div className="text-sm text-blue-600">{selectedYoungsterData.medicaments.join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Régime alimentaire</h4>
                      <div className="text-sm">
                        {selectedYoungsterData.regime || "Normal"}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Inscription</h4>
                      <div className="text-sm text-gray-600">
                        {new Date(selectedYoungsterData.dateInscription).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sélectionnez un jeune pour voir sa fiche</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Jeunes;
