
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJeunes } from "@/hooks/useJeunes";
import { useGroups } from "@/hooks/useGroups";
import jsPDF from 'jspdf';

interface QuartierLibre {
  id: string;
  jeuneId: string;
  groupeQuartierLibre: string;
  heureDepart: string;
  heureRetour: string;
}

const QuartiersLibres = () => {
  const [quartiersLibres, setQuartiersLibres] = useState<QuartierLibre[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuartierLibre, setNewQuartierLibre] = useState({
    jeuneId: '',
    groupeQuartierLibre: '',
    heureDepart: '',
    heureRetour: ''
  });
  
  const { toast } = useToast();
  const { jeunes } = useJeunes();
  const { groupes } = useGroups();

  const handleAddQuartierLibre = () => {
    if (!newQuartierLibre.jeuneId || !newQuartierLibre.groupeQuartierLibre || 
        !newQuartierLibre.heureDepart || !newQuartierLibre.heureRetour) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const quartierLibre: QuartierLibre = {
      id: Date.now().toString(),
      ...newQuartierLibre
    };

    setQuartiersLibres([...quartiersLibres, quartierLibre]);
    setNewQuartierLibre({
      jeuneId: '',
      groupeQuartierLibre: '',
      heureDepart: '',
      heureRetour: ''
    });
    setShowAddForm(false);
    
    toast({
      title: "Quartier libre ajouté",
      description: "Le quartier libre a été ajouté avec succès"
    });
  };

  const handleDeleteQuartierLibre = (id: string) => {
    setQuartiersLibres(quartiersLibres.filter(ql => ql.id !== id));
    toast({
      title: "Quartier libre supprimé",
      description: "Le quartier libre a été supprimé"
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text('Liste des Quartiers Libres', 20, 30);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
    
    // Headers du tableau
    doc.setFontSize(10);
    const headers = ['Nom', 'Prénom', 'Groupe QL', 'Heure départ', 'Heure retour'];
    const startY = 65;
    const cellWidth = 35;
    
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * cellWidth), startY);
    });
    
    // Ligne sous les headers
    doc.line(20, startY + 5, 20 + (headers.length * cellWidth), startY + 5);
    
    // Données
    quartiersLibres.forEach((ql, index) => {
      const jeune = jeunes.find(j => j.id === ql.jeuneId);
      if (jeune) {
        const y = startY + 15 + (index * 10);
        doc.text(jeune.nom, 20, y);
        doc.text(jeune.prenom, 20 + cellWidth, y);
        doc.text(ql.groupeQuartierLibre, 20 + (cellWidth * 2), y);
        doc.text(ql.heureDepart, 20 + (cellWidth * 3), y);
        doc.text(ql.heureRetour, 20 + (cellWidth * 4), y);
      }
    });
    
    // Sauvegarder le PDF
    doc.save(`quartiers-libres-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF généré",
      description: "Le fichier PDF a été téléchargé avec succès"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Gestion des Quartiers Libres</span>
              </CardTitle>
              <CardDescription>
                Gérez les autorisations de sortie des jeunes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? "outline" : "default"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? "Annuler" : "Ajouter"}
              </Button>
              <Button 
                onClick={generatePDF}
                variant="outline"
                disabled={quartiersLibres.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Générer PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Ajouter un quartier libre</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jeune">Jeune</Label>
                  <Select 
                    value={newQuartierLibre.jeuneId} 
                    onValueChange={(value) => setNewQuartierLibre({ ...newQuartierLibre, jeuneId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jeune" />
                    </SelectTrigger>
                    <SelectContent>
                      {jeunes.map((jeune) => (
                        <SelectItem key={jeune.id} value={jeune.id}>
                          {jeune.prenom} {jeune.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="groupe">Groupe de quartier libre</Label>
                  <Input
                    id="groupe"
                    value={newQuartierLibre.groupeQuartierLibre}
                    onChange={(e) => setNewQuartierLibre({ ...newQuartierLibre, groupeQuartierLibre: e.target.value })}
                    placeholder="Ex: Groupe A, Centre-ville..."
                  />
                </div>
                <div>
                  <Label htmlFor="depart">Heure de départ</Label>
                  <Input
                    id="depart"
                    type="time"
                    value={newQuartierLibre.heureDepart}
                    onChange={(e) => setNewQuartierLibre({ ...newQuartierLibre, heureDepart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="retour">Heure de retour</Label>
                  <Input
                    id="retour"
                    type="time"
                    value={newQuartierLibre.heureRetour}
                    onChange={(e) => setNewQuartierLibre({ ...newQuartierLibre, heureRetour: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="mt-4"
                onClick={handleAddQuartierLibre}
              >
                Ajouter le quartier libre
              </Button>
            </div>
          )}

          {quartiersLibres.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun quartier libre</h3>
              <p className="text-gray-500">Commencez par ajouter des autorisations de sortie</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Groupe QL</TableHead>
                    <TableHead>Heure départ</TableHead>
                    <TableHead>Heure retour</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quartiersLibres.map((ql) => {
                    const jeune = jeunes.find(j => j.id === ql.jeuneId);
                    return (
                      <TableRow key={ql.id}>
                        <TableCell className="font-medium">{jeune?.nom}</TableCell>
                        <TableCell>{jeune?.prenom}</TableCell>
                        <TableCell>{ql.groupeQuartierLibre}</TableCell>
                        <TableCell>{ql.heureDepart}</TableCell>
                        <TableCell>{ql.heureRetour}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteQuartierLibre(ql.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuartiersLibres;
