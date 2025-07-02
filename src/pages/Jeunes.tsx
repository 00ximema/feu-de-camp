
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, FileText, Phone, Mail, MapPin, Calendar, AlertTriangle, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Youngster } from "@/types/youngster";

const Jeunes = () => {
  const [jeunes, setJeunes] = useState<Youngster[]>([]);
  const [selectedJeune, setSelectedJeune] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    age: "",
    dateNaissance: "",
    adresse: "",
    ville: "",
    telephone: "",
    email: "",
    contactUrgence: "",
    allergies: [] as string[],
    medicaments: [] as string[],
    regime: [] as string[],
    remarques: ""
  });

  // Charger les jeunes depuis localStorage au démarrage
  useEffect(() => {
    const savedJeunes = localStorage.getItem('centre-jeunes');
    if (savedJeunes) {
      setJeunes(JSON.parse(savedJeunes));
    }
  }, []);

  // Sauvegarder les jeunes dans localStorage à chaque changement
  useEffect(() => {
    if (jeunes.length > 0) {
      localStorage.setItem('centre-jeunes', JSON.stringify(jeunes));
    }
  }, [jeunes]);

  const addJeune = () => {
    const newJeune: Youngster = {
      id: Date.now().toString(),
      nom: form.nom,
      prenom: form.prenom,
      age: parseInt(form.age),
      dateNaissance: form.dateNaissance,
      adresse: form.adresse,
      ville: form.ville,
      telephone: form.telephone,
      email: form.email,
      contactUrgence: form.contactUrgence,
      allergies: form.allergies,
      medicaments: form.medicaments,
      regime: form.regime,
      remarques: form.remarques,
      dateInscription: new Date().toISOString().split('T')[0]
    };

    setJeunes(prev => [...prev, newJeune]);
    
    // Réinitialiser le formulaire
    setForm({
      nom: "",
      prenom: "",
      age: "",
      dateNaissance: "",
      adresse: "",
      ville: "",
      telephone: "",
      email: "",
      contactUrgence: "",
      allergies: [],
      medicaments: [],
      regime: [],
      remarques: ""
    });
    
    setShowForm(false);
    
    toast({
      title: "Jeune ajouté",
      description: `${form.prenom} ${form.nom} a été ajouté avec succès`
    });
  };

  const handleArrayInput = (field: 'allergies' | 'medicaments' | 'regime', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setForm(prev => ({ ...prev, [field]: items }));
  };

  const filteredJeunes = jeunes.filter(jeune =>
    `${jeune.prenom} ${jeune.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jeune.age.toString().includes(searchTerm)
  );

  const selectedJeuneData = jeunes.find(j => j.id === selectedJeune);

  const getAgeColor = (age: number) => {
    if (age <= 6) return 'bg-purple-100 text-purple-800';
    if (age <= 12) return 'bg-blue-100 text-blue-800';
    if (age <= 17) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getAgeCategory = (age: number) => {
    if (age <= 6) return 'Petite enfance';
    if (age <= 12) return 'Enfance';
    if (age <= 17) return 'Adolescence';
    return 'Jeune adulte';
  };

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
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{jeunes.length}</span>
              </div>
              <p className="text-sm text-gray-600">Total inscrits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{jeunes.filter(j => j.age <= 6).length}</span>
              </div>
              <p className="text-sm text-gray-600">Petite enfance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{jeunes.filter(j => j.age > 6 && j.age <= 12).length}</span>
              </div>
              <p className="text-sm text-gray-600">Enfance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">
                  {jeunes.filter(j => (j.allergies && j.allergies.length > 0) || (j.medicaments && j.medicaments.length > 0)).length}
                </span>
              </div>
              <p className="text-sm text-gray-600">Avec besoins spéciaux</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des jeunes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Liste des jeunes</CardTitle>
                    <CardDescription>
                      {filteredJeunes.length} jeune(s) affiché(s)
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(true)} disabled={showForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau jeune
                  </Button>
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Rechercher par nom ou âge..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
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
                        <Label>Date de naissance</Label>
                        <Input
                          type="date"
                          value={form.dateNaissance}
                          onChange={(e) => setForm(prev => ({ ...prev, dateNaissance: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Adresse</Label>
                        <Input
                          value={form.adresse}
                          onChange={(e) => setForm(prev => ({ ...prev, adresse: e.target.value }))}
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
                    <div className="mt-4">
                      <Label>Contact d'urgence</Label>
                      <Input
                        value={form.contactUrgence}
                        onChange={(e) => setForm(prev => ({ ...prev, contactUrgence: e.target.value }))}
                        placeholder="Nom et téléphone du contact d'urgence"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>Allergies (séparées par des virgules)</Label>
                        <Input
                          value={form.allergies.join(', ')}
                          onChange={(e) => handleArrayInput('allergies', e.target.value)}
                          placeholder="Arachides, Lactose..."
                        />
                      </div>
                      <div>
                        <Label>Médicaments (séparés par des virgules)</Label>
                        <Input
                          value={form.medicaments.join(', ')}
                          onChange={(e) => handleArrayInput('medicaments', e.target.value)}
                          placeholder="Ventoline, Insuline..."
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Régime alimentaire (séparé par des virgules)</Label>
                      <Input
                        value={form.regime.join(', ')}
                        onChange={(e) => handleArrayInput('regime', e.target.value)}
                        placeholder="Végétarien, Sans gluten, Halal..."
                      />
                    </div>
                    <div className="mt-4">
                      <Label>Remarques</Label>
                      <Textarea
                        value={form.remarques}
                        onChange={(e) => setForm(prev => ({ ...prev, remarques: e.target.value }))}
                        placeholder="Informations complémentaires..."
                      />
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={addJeune}>Ajouter</Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredJeunes.map((jeune) => (
                    <div
                      key={jeune.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedJeune === jeune.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedJeune(jeune.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">
                            {jeune.prenom} {jeune.nom}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded ${getAgeColor(jeune.age)}`}>
                              {jeune.age} ans • {getAgeCategory(jeune.age)}
                            </span>
                            {jeune.ville && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{jeune.ville}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            {jeune.allergies && jeune.allergies.length > 0 && (
                              <div className="flex items-center space-x-1 text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Allergies: {jeune.allergies.join(', ')}</span>
                              </div>
                            )}
                            {jeune.medicaments && jeune.medicaments.length > 0 && (
                              <div className="flex items-center space-x-1 text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Médicaments: {jeune.medicaments.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {jeune.regime && jeune.regime.length > 0 && (
                            <div className="flex items-center space-x-1 text-sm text-blue-600">
                              <Utensils className="h-3 w-3" />
                              <span>Régime: {jeune.regime.join(', ')}</span>
                            </div>
                          )}
                          {jeune.dateInscription && (
                            <div className="text-xs text-gray-500 mt-1">
                              Inscrit le {new Date(jeune.dateInscription).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredJeunes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun jeune trouvé</p>
                      {searchTerm ? (
                        <p className="text-sm">Essayez de modifier votre recherche</p>
                      ) : (
                        <p className="text-sm">Commencez par ajouter des jeunes</p>
                      )}
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
                  <FileText className="h-5 w-5" />
                  <span>Fiche détaillée</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedJeuneData ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-lg">
                        {selectedJeuneData.prenom} {selectedJeuneData.nom}
                      </div>
                      <div className="text-blue-600">
                        {selectedJeuneData.age} ans • {getAgeCategory(selectedJeuneData.age)}
                      </div>
                    </div>

                    {selectedJeuneData.dateNaissance && (
                      <div>
                        <h4 className="font-medium mb-1">Date de naissance</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedJeuneData.dateNaissance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}

                    {(selectedJeuneData.adresse || selectedJeuneData.ville) && (
                      <div>
                        <h4 className="font-medium mb-1">Adresse</h4>
                        <div className="text-sm text-gray-600">
                          {selectedJeuneData.adresse && <div>{selectedJeuneData.adresse}</div>}
                          {selectedJeuneData.ville && <div>{selectedJeuneData.ville}</div>}
                        </div>
                      </div>
                    )}

                    {(selectedJeuneData.telephone || selectedJeuneData.email) && (
                      <div>
                        <h4 className="font-medium mb-1">Contact</h4>
                        <div className="space-y-1">
                          {selectedJeuneData.telephone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{selectedJeuneData.telephone}</span>
                            </div>
                          )}
                          {selectedJeuneData.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              <span>{selectedJeuneData.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedJeuneData.contactUrgence && (
                      <div>
                        <h4 className="font-medium mb-1">Contact d'urgence</h4>
                        <p className="text-sm text-gray-600">{selectedJeuneData.contactUrgence}</p>
                      </div>
                    )}

                    {selectedJeuneData.allergies && selectedJeuneData.allergies.length > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-orange-800 mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Allergies</span>
                        </div>
                        <div className="text-sm text-orange-700">
                          {selectedJeuneData.allergies.join(', ')}
                        </div>
                      </div>
                    )}

                    {selectedJeuneData.medicaments && selectedJeuneData.medicaments.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-800 mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Médicaments</span>
                        </div>
                        <div className="text-sm text-red-700">
                          {selectedJeuneData.medicaments.join(', ')}
                        </div>
                      </div>
                    )}

                    {selectedJeuneData.regime && selectedJeuneData.regime.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1 flex items-center space-x-2">
                          <Utensils className="h-4 w-4" />
                          <span>Régime alimentaire</span>
                        </h4>
                        <div className="text-sm text-gray-600">
                          {selectedJeuneData.regime.join(', ')}
                        </div>
                      </div>
                    )}

                    {selectedJeuneData.remarques && (
                      <div>
                        <h4 className="font-medium mb-1">Remarques</h4>
                        <div className="p-3 bg-gray-50 rounded text-sm">
                          {selectedJeuneData.remarques}
                        </div>
                      </div>
                    )}

                    {selectedJeuneData.dateInscription && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Inscrit le {new Date(selectedJeuneData.dateInscription).toLocaleDateString('fr-FR')}
                      </div>
                    )}
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
