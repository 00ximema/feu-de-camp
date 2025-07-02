
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Upload, FileSpreadsheet, TrendingUp, TrendingDown, Euro, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface FichierComptable {
  id: number;
  nom: string;
  type: 'recettes' | 'depenses' | 'budget' | 'bilan';
  dateUpload: string;
  donnees: any[];
  totalCalcule?: number;
}

interface Transaction {
  id: number;
  date: string;
  libelle: string;
  montant: number;
  categorie: string;
  type: 'recette' | 'depense';
}

const Comptabilite = () => {
  const [fichiers, setFichiers] = useState<FichierComptable[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFichier, setSelectedFichier] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "",
    type: "" as 'recettes' | 'depenses' | 'budget' | 'bilan' | ""
  });

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && form.type) {
      Array.from(files).forEach(file => {
        // Simulation de lecture Excel - en réalité il faudrait une lib comme xlsx
        const reader = new FileReader();
        reader.onload = (e) => {
          // Simulation de données Excel parsées
          const donneesMock = generateMockData(form.type as any);
          
          const newFichier: FichierComptable = {
            id: Date.now() + Math.random(),
            nom: form.nom || file.name,
            type: form.type as any,
            dateUpload: new Date().toLocaleDateString('fr-FR'),
            donnees: donneesMock,
            totalCalcule: calculerTotal(donneesMock, form.type as any)
          };

          setFichiers(prev => [...prev, newFichier]);
          
          // Ajouter aux transactions si c'est recettes ou dépenses
          if (form.type === 'recettes' || form.type === 'depenses') {
            const newTransactions = donneesMock.map((ligne: any, index: number) => ({
              id: Date.now() + index,
              date: ligne.date || new Date().toISOString().split('T')[0],
              libelle: ligne.libelle || ligne.description || `Transaction ${index + 1}`,
              montant: parseFloat(ligne.montant) || 0,
              categorie: ligne.categorie || 'Général',
              type: form.type as 'recette' | 'depense'
            }));
            
            setTransactions(prev => [...prev, ...newTransactions]);
          }
        };
        reader.readAsText(file);
      });

      setForm({ nom: "", type: "" });
      setShowForm(false);
      
      toast({
        title: "Fichier importé",
        description: `Fichier ${form.type} importé avec succès`
      });
    }
  };

  const generateMockData = (type: string) => {
    // Génère des données d'exemple selon le type
    switch (type) {
      case 'recettes':
        return [
          { date: '2024-07-01', libelle: 'Inscription jeune 1', montant: 450, categorie: 'Inscriptions' },
          { date: '2024-07-02', libelle: 'Inscription jeune 2', montant: 450, categorie: 'Inscriptions' },
          { date: '2024-07-05', libelle: 'Subvention CAF', montant: 2000, categorie: 'Subventions' }
        ];
      case 'depenses':
        return [
          { date: '2024-07-01', libelle: 'Courses alimentaires', montant: 350, categorie: 'Alimentation' },
          { date: '2024-07-02', libelle: 'Activité piscine', montant: 120, categorie: 'Activités' },
          { date: '2024-07-03', libelle: 'Matériel pédagogique', montant: 85, categorie: 'Matériel' }
        ];
      case 'budget':
        return [
          { poste: 'Alimentation', prevu: 5000, realise: 0 },
          { poste: 'Activités', prevu: 2000, realise: 0 },
          { poste: 'Personnel', prevu: 8000, realise: 0 }
        ];
      default:
        return [];
    }
  };

  const calculerTotal = (donnees: any[], type: string) => {
    if (type === 'budget') {
      return donnees.reduce((sum, item) => sum + (item.prevu || 0), 0);
    }
    return donnees.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
  };

  const calculerBilan = () => {
    const totalRecettes = transactions
      .filter(t => t.type === 'recette')
      .reduce((sum, t) => sum + t.montant, 0);
    
    const totalDepenses = transactions
      .filter(t => t.type === 'depense')
      .reduce((sum, t) => sum + t.montant, 0);
    
    return {
      recettes: totalRecettes,
      depenses: totalDepenses,
      resultat: totalRecettes - totalDepenses
    };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recettes': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'depenses': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'budget': return <Euro className="h-4 w-4 text-blue-600" />;
      case 'bilan': return <Calculator className="h-4 w-4 text-purple-600" />;
      default: return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recettes': return 'border-green-500 bg-green-50';
      case 'depenses': return 'border-red-500 bg-red-50';
      case 'budget': return 'border-blue-500 bg-blue-50';
      case 'bilan': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const bilan = calculerBilan();
  const selectedFichierData = fichiers.find(f => f.id === selectedFichier);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="h-6 w-6 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gestion des fichiers */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fichiers comptables</CardTitle>
                    <CardDescription>
                      Importez vos fichiers Excel de recettes, dépenses, budgets
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(true)} disabled={showForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Importer fichier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">Nouveau fichier comptable</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Nom du fichier</Label>
                        <Input
                          value={form.nom}
                          onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                          placeholder="Laissez vide pour utiliser le nom du fichier"
                        />
                      </div>
                      
                      <div>
                        <Label>Type de fichier</Label>
                        <Select 
                          value={form.type} 
                          onValueChange={(value: any) => setForm(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recettes">Fichier recettes</SelectItem>
                            <SelectItem value="depenses">Fichier dépenses</SelectItem>
                            <SelectItem value="budget">Budget prévisionnel</SelectItem>
                            <SelectItem value="bilan">Bilan comptable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Fichier Excel</Label>
                        <Input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleExcelUpload}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Formats acceptés : Excel (.xlsx, .xls), CSV
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setShowForm(false)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {fichiers.map((fichier) => (
                    <div
                      key={fichier.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFichier === fichier.id 
                          ? getTypeColor(fichier.type)
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFichier(fichier.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(fichier.type)}
                          <div>
                            <div className="font-medium">{fichier.nom}</div>
                            <div className="text-sm text-gray-600">
                              {fichier.type.charAt(0).toUpperCase() + fichier.type.slice(1)} • 
                              Importé le {fichier.dateUpload}
                            </div>
                            <div className="text-sm text-gray-500">
                              {fichier.donnees.length} ligne(s) de données
                            </div>
                          </div>
                        </div>
                        {fichier.totalCalcule && (
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {fichier.totalCalcule.toFixed(2)} €
                            </div>
                            <div className="text-sm text-gray-600">Total</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {fichiers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun fichier comptable importé</p>
                      <p className="text-sm">Commencez par importer vos fichiers Excel</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails du fichier sélectionné */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>Détails</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFichierData ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{selectedFichierData.nom}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {selectedFichierData.type}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Données</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedFichierData.donnees.slice(0, 10).map((ligne, index) => (
                          <div key={index} className="p-2 border rounded text-sm">
                            {selectedFichierData.type === 'budget' ? (
                              <div>
                                <div className="font-medium">{ligne.poste}</div>
                                <div className="text-gray-600">
                                  Prévu: {ligne.prevu}€ | Réalisé: {ligne.realise}€
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">{ligne.libelle}</div>
                                <div className="text-gray-600">
                                  {ligne.date} • {ligne.montant}€
                                </div>
                                {ligne.categorie && (
                                  <div className="text-xs text-gray-500">{ligne.categorie}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {selectedFichierData.donnees.length > 10 && (
                          <div className="text-center text-sm text-gray-500">
                            ... et {selectedFichierData.donnees.length - 10} autres lignes
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedFichierData.totalCalcule && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900">Total calculé</div>
                        <div className="text-xl font-bold text-blue-600">
                          {selectedFichierData.totalCalcule.toFixed(2)} €
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sélectionnez un fichier pour voir les détails</p>
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
