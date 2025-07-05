
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, ArrowLeft, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Jeune {
  id: string;
  nom: string;
  prenom: string;
  dateDeNaissance: string;
  adresse: string;
  telephone: string;
  email: string;
  informationsMedicales: string;
  personneContactNom: string;
  personneContactTelephone: string;
  notes: string;
  createdAt: string;
}

const Jeunes = () => {
  const [jeunes, setJeunes] = useState<Jeune[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJeune, setEditingJeune] = useState<Jeune | null>(null);
  const { toast } = useToast();

  const [newJeune, setNewJeune] = useState({
    nom: "",
    prenom: "",
    dateDeNaissance: "",
    adresse: "",
    telephone: "",
    email: "",
    informationsMedicales: "",
    personneContactNom: "",
    personneContactTelephone: "",
    notes: ""
  });

  const [stats, setStats] = useState({
    total: 0
  });

  useEffect(() => {
    const savedJeunes = localStorage.getItem('jeunes');
    if (savedJeunes) {
      try {
        setJeunes(JSON.parse(savedJeunes));
      } catch (error) {
        console.error('Erreur lors du chargement des jeunes:', error);
      }
    }
  }, []);

  useEffect(() => {
    setStats({
      total: jeunes.length
    });
  }, [jeunes]);

  const saveJeunes = (updatedJeunes: Jeune[]) => {
    localStorage.setItem('jeunes', JSON.stringify(updatedJeunes));
    setJeunes(updatedJeunes);
  };

  const handleAddJeune = () => {
    if (!newJeune.nom || !newJeune.prenom || !newJeune.dateDeNaissance) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom, prénom et la date de naissance",
        variant: "destructive"
      });
      return;
    }

    const jeune: Jeune = {
      id: Date.now().toString(),
      nom: newJeune.nom.toUpperCase(),
      prenom: newJeune.prenom,
      dateDeNaissance: newJeune.dateDeNaissance,
      adresse: newJeune.adresse,
      telephone: newJeune.telephone,
      email: newJeune.email,
      informationsMedicales: newJeune.informationsMedicales,
      personneContactNom: newJeune.personneContactNom,
      personneContactTelephone: newJeune.personneContactTelephone,
      notes: newJeune.notes,
      createdAt: new Date().toISOString()
    };

    const updatedJeunes = [...jeunes, jeune];
    saveJeunes(updatedJeunes);

    toast({
      title: "Jeune ajouté",
      description: `${newJeune.prenom} ${newJeune.nom} a été ajouté`
    });

    setNewJeune({
      nom: "",
      prenom: "",
      dateDeNaissance: "",
      adresse: "",
      telephone: "",
      email: "",
      informationsMedicales: "",
      personneContactNom: "",
      personneContactTelephone: "",
      notes: ""
    });
    setShowAddForm(false);
  };

  const handleDeleteJeune = (id: string) => {
    const updatedJeunes = jeunes.filter(jeune => jeune.id !== id);
    saveJeunes(updatedJeunes);
    toast({
      title: "Jeune supprimé",
      description: "Le jeune a été supprimé"
    });
  };

  const handleUpdateJeune = () => {
    if (!editingJeune) return;

    const updatedJeunes = jeunes.map(jeune => 
      jeune.id === editingJeune.id ? editingJeune : jeune
    );
    saveJeunes(updatedJeunes);
    setEditingJeune(null);
    toast({
      title: "Jeune mis à jour",
      description: "Les informations ont été mises à jour"
    });
  };

  const handleNumericInput = (value: string, field: 'telephone' | 'personneContactTelephone') => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setNewJeune({ ...newJeune, [field]: numericValue });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion des jeunes</h1>
              <Badge variant="secondary">{stats.total} total</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Jeunes ({stats.total})</span>
                </CardTitle>
                <CardDescription>Gérez les jeunes de la maison de la gendarmerie</CardDescription>
              </div>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un jeune
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un jeune</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau jeune
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nom">Nom de famille</Label>
                        <Input
                          id="nom"
                          value={newJeune.nom}
                          onChange={(e) => setNewJeune({ ...newJeune, nom: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          value={newJeune.prenom}
                          onChange={(e) => setNewJeune({ ...newJeune, prenom: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dateDeNaissance">Date de naissance</Label>
                      <Input
                        id="dateDeNaissance"
                        type="date"
                        value={newJeune.dateDeNaissance}
                        onChange={(e) => setNewJeune({ ...newJeune, dateDeNaissance: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="adresse">Adresse</Label>
                      <Input
                        id="adresse"
                        value={newJeune.adresse}
                        onChange={(e) => setNewJeune({ ...newJeune, adresse: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                          id="telephone"
                          value={newJeune.telephone}
                          onChange={(e) => handleNumericInput(e.target.value, 'telephone')}
                          placeholder="0123456789"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newJeune.email}
                          onChange={(e) => setNewJeune({ ...newJeune, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="informationsMedicales">Informations médicales</Label>
                      <Input
                        id="informationsMedicales"
                        value={newJeune.informationsMedicales}
                        onChange={(e) => setNewJeune({ ...newJeune, informationsMedicales: e.target.value })}
                        placeholder="Allergies, traitements..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="personneContactNom">Personne à contacter (nom)</Label>
                        <Input
                          id="personneContactNom"
                          value={newJeune.personneContactNom}
                          onChange={(e) => setNewJeune({ ...newJeune, personneContactNom: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="personneContactTelephone">Personne à contacter (téléphone)</Label>
                        <Input
                          id="personneContactTelephone"
                          value={newJeune.personneContactTelephone}
                          onChange={(e) => handleNumericInput(e.target.value, 'personneContactTelephone')}
                          placeholder="0123456789"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={newJeune.notes}
                        onChange={(e) => setNewJeune({ ...newJeune, notes: e.target.value })}
                        placeholder="Informations complémentaires..."
                      />
                    </div>
                    <Button 
                      className="w-full"
                      disabled={!newJeune.nom || !newJeune.prenom || !newJeune.dateDeNaissance}
                      onClick={handleAddJeune}
                    >
                      Ajouter le jeune
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {jeunes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun jeune</h3>
                <p className="text-gray-500 mb-4">Commencez par ajouter des jeunes</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Date de naissance</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Personne à contacter</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jeunes.map((jeune) => (
                      <TableRow key={jeune.id}>
                        <TableCell className="font-medium">
                          {jeune.prenom} {jeune.nom}
                        </TableCell>
                        <TableCell>{new Date(jeune.dateDeNaissance).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {jeune.telephone && <div>{jeune.telephone}</div>}
                            {jeune.email && <div className="text-gray-500">{jeune.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{jeune.personneContactNom}</div>
                            {jeune.personneContactTelephone && <div>{jeune.personneContactTelephone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingJeune(jeune)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteJeune(jeune.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'édition */}
        <Dialog open={!!editingJeune} onOpenChange={() => setEditingJeune(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le jeune</DialogTitle>
              <DialogDescription>
                Modifiez les informations du jeune
              </DialogDescription>
            </DialogHeader>
            {editingJeune && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nom">Nom de famille</Label>
                    <Input
                      id="edit-nom"
                      value={editingJeune.nom}
                      onChange={(e) => setEditingJeune({ ...editingJeune, nom: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-prenom">Prénom</Label>
                    <Input
                      id="edit-prenom"
                      value={editingJeune.prenom}
                      onChange={(e) => setEditingJeune({ ...editingJeune, prenom: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-dateDeNaissance">Date de naissance</Label>
                  <Input
                    id="edit-dateDeNaissance"
                    type="date"
                    value={editingJeune.dateDeNaissance}
                    onChange={(e) => setEditingJeune({ ...editingJeune, dateDeNaissance: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-adresse">Adresse</Label>
                  <Input
                    id="edit-adresse"
                    value={editingJeune.adresse}
                    onChange={(e) => setEditingJeune({ ...editingJeune, adresse: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-telephone">Téléphone</Label>
                    <Input
                      id="edit-telephone"
                      value={editingJeune.telephone}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setEditingJeune({ ...editingJeune, telephone: numericValue });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingJeune.email}
                      onChange={(e) => setEditingJeune({ ...editingJeune, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-informationsMedicales">Informations médicales</Label>
                  <Input
                    id="edit-informationsMedicales"
                    value={editingJeune.informationsMedicales}
                    onChange={(e) => setEditingJeune({ ...editingJeune, informationsMedicales: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-personneContactNom">Personne à contacter (nom)</Label>
                    <Input
                      id="edit-personneContactNom"
                      value={editingJeune.personneContactNom}
                      onChange={(e) => setEditingJeune({ ...editingJeune, personneContactNom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-personneContactTelephone">Personne à contacter (téléphone)</Label>
                    <Input
                      id="edit-personneContactTelephone"
                      value={editingJeune.personneContactTelephone}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setEditingJeune({ ...editingJeune, personneContactTelephone: numericValue });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={editingJeune.notes}
                    onChange={(e) => setEditingJeune({ ...editingJeune, notes: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handleUpdateJeune}
                >
                  Mettre à jour
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Jeunes;
