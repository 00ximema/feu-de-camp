import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJeunes } from "@/hooks/useJeunes";
import jsPDF from 'jspdf';

interface QuartierLibre {
  id: string;
  jeuneIds: string[];
  groupeQuartierLibre: string;
  heureDepart: string;
  heureRetour?: string;
  statut: 'en_cours' | 'termine';
}

const QuartiersLibres = () => {
  const [quartiersLibres, setQuartiersLibres] = useState<QuartierLibre[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedJeunes, setSelectedJeunes] = useState<string[]>([]);
  const [newQuartierLibre, setNewQuartierLibre] = useState({
    groupeQuartierLibre: '',
    heureDepart: ''
  });
  
  const { toast } = useToast();
  const { jeunes } = useJeunes();

  const addLogoToPdf = (pdf: jsPDF) => {
    // Header avec logo
    pdf.setFillColor(65, 105, 225);
    pdf.rect(0, 0, 210, 25, 'F');
    
    // Logo Fondation MG en blanc
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('Fondation MG', 15, 12);
    pdf.setFontSize(12);
    pdf.text('Maison de la Gendarmerie', 15, 19);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  };

  const handleJeuneSelection = (jeuneId: string, checked: boolean) => {
    if (checked) {
      setSelectedJeunes([...selectedJeunes, jeuneId]);
    } else {
      setSelectedJeunes(selectedJeunes.filter(id => id !== jeuneId));
    }
  };

  const handleAddQuartierLibre = () => {
    if (selectedJeunes.length === 0 || !newQuartierLibre.groupeQuartierLibre || !newQuartierLibre.heureDepart) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un jeune, renseigner le groupe et l'heure de départ",
        variant: "destructive"
      });
      return;
    }

    const quartierLibre: QuartierLibre = {
      id: Date.now().toString(),
      jeuneIds: [...selectedJeunes],
      groupeQuartierLibre: newQuartierLibre.groupeQuartierLibre,
      heureDepart: newQuartierLibre.heureDepart,
      statut: 'en_cours'
    };

    setQuartiersLibres([...quartiersLibres, quartierLibre]);
    setNewQuartierLibre({
      groupeQuartierLibre: '',
      heureDepart: ''
    });
    setSelectedJeunes([]);
    setShowAddForm(false);
    
    toast({
      title: "Quartier libre ajouté",
      description: "Le quartier libre a été créé avec succès"
    });
  };

  const handleUpdateHeureRetour = (id: string, heureRetour: string) => {
    setQuartiersLibres(quartiersLibres.map(ql => 
      ql.id === id 
        ? { ...ql, heureRetour, statut: 'termine' as const }
        : ql
    ));
    toast({
      title: "Heure de retour mise à jour",
      description: "Le quartier libre a été terminé"
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
    
    // Ajouter le logo
    addLogoToPdf(doc);
    
    // Titre
    doc.setFontSize(20);
    doc.text('Liste des Quartiers Libres', 20, 40);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);
    
    // Headers du tableau
    doc.setFontSize(10);
    const headers = ['Jeunes', 'Groupe QL', 'Heure départ', 'Heure retour'];
    const startY = 75;
    const cellWidth = 45;
    
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * cellWidth), startY);
    });
    
    // Ligne sous les headers
    doc.line(20, startY + 5, 20 + (headers.length * cellWidth), startY + 5);
    
    // Données
    quartiersLibres.forEach((ql, index) => {
      const jeunesNoms = ql.jeuneIds.map(id => {
        const jeune = jeunes.find(j => j.id === id);
        return jeune ? `${jeune.prenom} ${jeune.nom}` : '';
      }).join(', ');
      
      const y = startY + 15 + (index * 10);
      doc.text(jeunesNoms.substring(0, 25) + (jeunesNoms.length > 25 ? '...' : ''), 20, y);
      doc.text(ql.groupeQuartierLibre, 20 + cellWidth, y);
      doc.text(ql.heureDepart, 20 + (cellWidth * 2), y);
      doc.text(ql.heureRetour || '', 20 + (cellWidth * 3), y);
    });
    
    // Sauvegarder le PDF
    doc.save(`quartiers-libres-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF généré",
      description: "Le fichier PDF a été téléchargé avec succès"
    });
  };

  const generateBlankPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Ajouter le logo
      addLogoToPdf(doc);
      
      // Titre
      doc.setFontSize(20);
      doc.text('Feuille de Quartiers Libres', 20, 40);
      
      // Date
      doc.setFontSize(12);
      doc.text(`Date: ______________`, 20, 55);
      doc.text(`Heure de départ: ______________`, 20, 70);
      
      // Liste de tous les jeunes
      doc.setFontSize(14);
      doc.text('Liste des jeunes:', 20, 90);
      
      const startY = 105;
      const lineHeight = 8;
      
      jeunes.forEach((jeune, index) => {
        const y = startY + (index * lineHeight);
        if (y > 270) return; // Éviter de dépasser la page
        
        // Case à cocher
        doc.rect(20, y - 3, 4, 4);
        // Nom du jeune
        doc.setFontSize(10);
        doc.text(`${jeune.prenom} ${jeune.nom}`, 30, y);
        
        // Groupe QL
        doc.text('Groupe QL: ________________', 100, y);
        
        // Heure de retour
        doc.text('Retour: ________', 170, y);
      });
      
      // Signature
      doc.setFontSize(12);
      doc.text('Responsable: ________________________________', 20, 280);
      
      // Sauvegarder le PDF
      doc.save(`feuille-quartiers-libres-vierge-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF vierge généré",
        description: "La feuille vierge a été téléchargée avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF vierge:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF vierge",
        variant: "destructive"
      });
    }
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
                PDF Rempli
              </Button>
              <Button 
                onClick={generateBlankPDF}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF Vierge
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Créer un nouveau quartier libre</h3>
              
              {/* Sélection des jeunes */}
              <div className="mb-4">
                <Label>Sélectionner les jeunes</Label>
                <div className="max-h-48 overflow-y-auto border rounded p-3 bg-card mt-2">
                  {jeunes.map((jeune) => (
                    <div key={jeune.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`jeune-${jeune.id}`}
                        checked={selectedJeunes.includes(jeune.id)}
                        onCheckedChange={(checked) => handleJeuneSelection(jeune.id, checked as boolean)}
                      />
                      <Label htmlFor={`jeune-${jeune.id}`} className="text-sm">
                        {jeune.prenom} {jeune.nom}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedJeunes.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedJeunes.length} jeune(s) sélectionné(s)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <Button 
                className="mt-4"
                onClick={handleAddQuartierLibre}
              >
                Créer le quartier libre
              </Button>
            </div>
          )}

          {quartiersLibres.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun quartier libre</h3>
              <p className="text-gray-500">Commencez par créer un groupe de quartier libre</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jeunes</TableHead>
                    <TableHead>Groupe QL</TableHead>
                    <TableHead>Heure départ</TableHead>
                    <TableHead>Heure retour</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quartiersLibres.map((ql) => {
                    const jeunesNoms = ql.jeuneIds.map(id => {
                      const jeune = jeunes.find(j => j.id === id);
                      return jeune ? `${jeune.prenom} ${jeune.nom}` : '';
                    }).join(', ');
                    
                    return (
                      <TableRow key={ql.id}>
                        <TableCell className="font-medium">{jeunesNoms}</TableCell>
                        <TableCell>{ql.groupeQuartierLibre}</TableCell>
                        <TableCell>{ql.heureDepart}</TableCell>
                        <TableCell>
                          {ql.statut === 'en_cours' ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                className="w-24"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleUpdateHeureRetour(ql.id, e.target.value);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            ql.heureRetour
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            ql.statut === 'en_cours' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {ql.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                          </span>
                        </TableCell>
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
