
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, Plus, Upload, FileText, Calendar, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Animateur {
  id: number;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  email: string;
  role: string;
  formations: string[];
  documents: Document[];
  notes: string;
}

interface Document {
  id: number;
  nom: string;
  type: string;
  dateUpload: string;
  url: string;
}

const Equipe = () => {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [selectedAnimateur, setSelectedAnimateur] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    age: "",
    telephone: "",
    email: "",
    role: "",
    formations: "",
    notes: ""
  });

  // Charger les animateurs depuis localStorage au démarrage
  useEffect(() => {
    const savedAnimateurs = localStorage.getItem('equipe-animateurs');
    if (savedAnimateurs) {
      setAnimateurs(JSON.parse(savedAnimateurs));
    }
  }, []);

  // Sauvegarder les animateurs dans localStorage à chaque changement
  useEffect(() => {
    if (animateurs.length > 0) {
      localStorage.setItem('equipe-animateurs', JSON.stringify(animateurs));
    }
  }, [animateurs]);

  const addAnimateur = () => {
    const newAnimateur: Animateur = {
      id: Date.now(),
      nom: form.nom,
      prenom: form.prenom,
      age: parseInt(form.age),
      telephone: form.telephone,
      email: form.email,
      role: form.role,
      formations: form.formations.split(',').map(f => f.trim()).filter(f => f),
      documents: [],
      notes: form.notes
    };

    setAnimateurs(prev => [...prev, newAnimateur]);
    setForm({
      nom: "",
      prenom: "",
      age: "",
      telephone: "",
      email: "",
      role: "",
      formations: "",
      notes: ""
    });
    setShowForm(false);
    
    toast({
      title: "Animateur ajouté",
      description: `${form.prenom} ${form.nom} a été ajouté à l'équipe et est disponible pour le planning`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedAnimateur) {
      Array.from(files).forEach(file => {
        const newDoc: Document = {
          id: Date.now() + Math.random(),
          nom: file.name,
          type: file.type,
          dateUpload: new Date().toLocaleDateString('fr-FR'),
          url: URL.createObjectURL(file)
        };

        setAnimateurs(prev => prev.map(anim => 
          anim.id === selectedAnimateur 
            ? { ...anim, documents: [...anim.documents, newDoc] }
            : anim
        ));
      });

      toast({
        title: "Documents uploadés",
        description: `${files.length} document(s) ajouté(s) avec succès`
      });
    }
  };

  const selectedAnimateurData = animateurs.find(a => a.id === selectedAnimateur);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion de l'équipe</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Retour accueil</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste de l'équipe */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Équipe d'animation</CardTitle>
                    <CardDescription>
                      {animateurs.length} animateur(s) dans l'équipe
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(true)} disabled={showForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel animateur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">Nouveau membre de l'équipe</h3>
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
                        <Label>Rôle</Label>
                        <Input
                          value={form.role}
                          onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                          placeholder="Animateur, Directeur, Cuisinier..."
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
                      <Label>Formations (séparées par des virgules)</Label>
                      <Input
                        value={form.formations}
                        onChange={(e) => setForm(prev => ({ ...prev, formations: e.target.value }))}
                        placeholder="BAFA, PSC1, Surveillance baignade..."
                      />
                    </div>
                    <div className="mt-4">
                      <Label>Notes</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Informations complémentaires..."
                      />
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={addAnimateur}>Ajouter</Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {animateurs.map((animateur) => (
                    <div
                      key={animateur.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnimateur === animateur.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAnimateur(animateur.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">
                            {animateur.prenom} {animateur.nom}
                          </div>
                          <div className="text-gray-600">
                            {animateur.role} • {animateur.age} ans
                            {animateur.age < 18 && (
                              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                Mineur
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{animateur.telephone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{animateur.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {animateur.formations.length} formation(s)
                          </div>
                          <div className="text-sm text-gray-500">
                            {animateur.documents.length} document(s)
                          </div>
                        </div>
                      </div>
                      {animateur.formations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {animateur.formations.map((formation, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {formation}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
                {selectedAnimateurData ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-lg">
                        {selectedAnimateurData.prenom} {selectedAnimateurData.nom}
                      </div>
                      <div className="text-gray-600">{selectedAnimateurData.role}</div>
                    </div>

                    {/* Upload de documents */}
                    <div>
                      <Label htmlFor="documents">Documents</Label>
                      <Input
                        id="documents"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Diplômes, certificats, pièces d'identité...
                      </p>
                    </div>

                    {/* Liste des documents */}
                    {selectedAnimateurData.documents.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Documents uploadés</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedAnimateurData.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded text-sm">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium">{doc.nom}</div>
                                <div className="text-gray-500">Ajouté le {doc.dateUpload}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedAnimateurData.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notes</h4>
                        <div className="p-3 bg-gray-50 rounded text-sm">
                          {selectedAnimateurData.notes}
                        </div>
                      </div>
                    )}

                    {/* Statut spécial pour mineurs */}
                    {selectedAnimateurData.age < 18 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-orange-800">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Animateur mineur</span>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          Droit à 2 jours de repos consécutifs le week-end selon la réglementation.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sélectionnez un animateur pour voir sa fiche</p>
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

export default Equipe;
