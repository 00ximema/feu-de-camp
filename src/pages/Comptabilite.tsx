import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, TrendingUp, TrendingDown, Euro, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import SimpleCalculator from "@/components/SimpleCalculator";


interface PieceComptable {
  id: number;
  date: string;
  libelle: string;
  montant: number;
  categorie: string;
  type: 'recette' | 'depense';
  pieceIntegree: boolean;
}

const Comptabilite = () => {
  const [piecesComptables, setPiecesComptables] = useState<PieceComptable[]>([]);
  const [showPieceForm, setShowPieceForm] = useState(false);
  const [editingPiece, setEditingPiece] = useState<PieceComptable | null>(null);
  const { toast } = useToast();

  const [pieceForm, setPieceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    libelle: "",
    montant: "",
    categorie: "",
    type: "recette" as 'recette' | 'depense',
    pieceIntegree: false
  });


  const calculerBilan = () => {
    const totalRecettes = piecesComptables
      .filter(p => p.type === 'recette')
      .reduce((sum, p) => sum + p.montant, 0);
    
    const totalDepenses = piecesComptables
      .filter(p => p.type === 'depense')
      .reduce((sum, p) => sum + p.montant, 0);
    
    return {
      recettes: totalRecettes,
      depenses: totalDepenses,
      resultat: totalRecettes - totalDepenses
    };
  };

  const handleAddPiece = () => {
    if (!pieceForm.libelle || !pieceForm.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const newPiece: PieceComptable = {
      id: editingPiece ? editingPiece.id : Date.now(),
      date: pieceForm.date,
      libelle: pieceForm.libelle,
      montant: parseFloat(pieceForm.montant),
      categorie: pieceForm.categorie || "Général",
      type: pieceForm.type,
      pieceIntegree: pieceForm.pieceIntegree
    };

    if (editingPiece) {
      setPiecesComptables(prev => prev.map(p => p.id === editingPiece.id ? newPiece : p));
      toast({
        title: "Pièce comptable modifiée",
        description: "La pièce comptable a été mise à jour avec succès"
      });
    } else {
      setPiecesComptables(prev => [...prev, newPiece]);
      toast({
        title: "Pièce comptable ajoutée",
        description: "La nouvelle pièce comptable a été enregistrée"
      });
    }

    setPieceForm({
      date: new Date().toISOString().split('T')[0],
      libelle: "",
      montant: "",
      categorie: "",
      type: "recette",
      pieceIntegree: false
    });
    setShowPieceForm(false);
    setEditingPiece(null);
  };

  const handleEditPiece = (piece: PieceComptable) => {
    setEditingPiece(piece);
    setPieceForm({
      date: piece.date,
      libelle: piece.libelle,
      montant: piece.montant.toString(),
      categorie: piece.categorie,
      type: piece.type,
      pieceIntegree: piece.pieceIntegree
    });
    setShowPieceForm(true);
  };

  const handleDeletePiece = (id: number) => {
    setPiecesComptables(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Pièce comptable supprimée",
      description: "La pièce comptable a été supprimée avec succès"
    });
  };

  const togglePieceIntegree = (id: number) => {
    setPiecesComptables(prev => prev.map(p => 
      p.id === id ? { ...p, pieceIntegree: !p.pieceIntegree } : p
    ));
  };


  const bilan = calculerBilan();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="h-6 w-6 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion comptable</h1>
            </div>
            <Link to="/">
              <Button variant="outline">Retour accueil</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tableau de bord financier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Recettes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {bilan.recettes.toFixed(2)} €
              </div>
              <p className="text-sm text-gray-600">Total des recettes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span>Dépenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {bilan.depenses.toFixed(2)} €
              </div>
              <p className="text-sm text-gray-600">Total des dépenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Euro className="h-5 w-5 text-blue-600" />
                <span>Résultat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                bilan.resultat >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {bilan.resultat.toFixed(2)} €
              </div>
              <p className="text-sm text-gray-600">
                {bilan.resultat >= 0 ? 'Excédent' : 'Déficit'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calculatrice et gestion des pièces comptables */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Calculatrice */}
          <div className="lg:col-span-1">
            <SimpleCalculator />
          </div>

          {/* Gestion des pièces comptables */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pièces comptables</CardTitle>
                    <CardDescription>
                      Gérez vos recettes et dépenses avec suivi d'intégration
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setShowPieceForm(true);
                      setEditingPiece(null);
                      setPieceForm({
                        date: new Date().toISOString().split('T')[0],
                        libelle: "",
                        montant: "",
                        categorie: "",
                        type: "recette",
                        pieceIntegree: false
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter pièce comptable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showPieceForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">
                      {editingPiece ? 'Modifier la pièce comptable' : 'Nouvelle pièce comptable'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={pieceForm.date}
                          onChange={(e) => setPieceForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={pieceForm.type} 
                          onValueChange={(value: 'recette' | 'depense') => setPieceForm(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recette">Recette</SelectItem>
                            <SelectItem value="depense">Dépense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Libellé *</Label>
                        <Input
                          value={pieceForm.libelle}
                          onChange={(e) => setPieceForm(prev => ({ ...prev, libelle: e.target.value }))}
                          placeholder="Description de la pièce comptable"
                        />
                      </div>

                      <div>
                        <Label>Montant * (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pieceForm.montant}
                          onChange={(e) => setPieceForm(prev => ({ ...prev, montant: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Catégorie</Label>
                        <Input
                          value={pieceForm.categorie}
                          onChange={(e) => setPieceForm(prev => ({ ...prev, categorie: e.target.value }))}
                          placeholder="Ex: Alimentation, Activités..."
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="pieceIntegree"
                          checked={pieceForm.pieceIntegree}
                          onCheckedChange={(checked) => setPieceForm(prev => ({ ...prev, pieceIntegree: checked as boolean }))}
                        />
                        <Label htmlFor="pieceIntegree">Pièce intégrée au document MG</Label>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button onClick={handleAddPiece}>
                        {editingPiece ? 'Modifier' : 'Ajouter'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPieceForm(false);
                          setEditingPiece(null);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {piecesComptables.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-center">Pièce intégrée</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {piecesComptables.map((piece) => (
                        <TableRow key={piece.id}>
                          <TableCell>{new Date(piece.date).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              piece.type === 'recette' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {piece.type === 'recette' ? 'Recette' : 'Dépense'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{piece.libelle}</TableCell>
                          <TableCell>{piece.categorie}</TableCell>
                          <TableCell className={`text-right font-bold ${
                            piece.type === 'recette' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {piece.type === 'recette' ? '+' : '-'}{piece.montant.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={piece.pieceIntegree}
                              onCheckedChange={() => togglePieceIntegree(piece.id)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPiece(piece)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePiece(piece.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune pièce comptable enregistrée</p>
                    <p className="text-sm">Commencez par ajouter vos premières pièces comptables</p>
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

export default Comptabilite;
