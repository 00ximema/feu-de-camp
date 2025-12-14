import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJeunes } from "@/hooks/useJeunes";
import jsPDF from 'jspdf';
import { createPdfHeader, addPdfFooter, checkNewPage, PDF_COLORS } from '@/utils/pdfTemplate';

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
    
    // En-tête unifié
    let yPosition = createPdfHeader(doc, {
      title: 'Liste des Quartiers Libres',
      subtitle: `${quartiersLibres.length} quartier(s) libre(s)`,
      showDate: true
    });
    
    // Headers du tableau
    const pageWidth = doc.internal.pageSize.width;
    const headers = ['Jeunes', 'Groupe QL', 'Heure départ', 'Heure retour', 'Statut'];
    const colWidths = [60, 35, 30, 30, 25];
    
    // En-tête du tableau
    doc.setFillColor(PDF_COLORS.backgroundLight.r, PDF_COLORS.backgroundLight.g, PDF_COLORS.backgroundLight.b);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
    
    let xPos = 17;
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPosition + 5);
      xPos += colWidths[index];
    });
    
    yPosition += 12;
    
    // Données
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
    
    quartiersLibres.forEach((ql) => {
      yPosition = checkNewPage(doc, yPosition, 12);
      
      const jeunesNoms = ql.jeuneIds.map(id => {
        const jeune = jeunes.find(j => j.id === id);
        return jeune ? `${jeune.prenom} ${jeune.nom}` : '';
      }).join(', ');
      
      doc.setFontSize(8);
      xPos = 17;
      doc.text(jeunesNoms.substring(0, 35) + (jeunesNoms.length > 35 ? '...' : ''), xPos, yPosition);
      xPos += colWidths[0];
      doc.text(ql.groupeQuartierLibre, xPos, yPosition);
      xPos += colWidths[1];
      doc.text(ql.heureDepart, xPos, yPosition);
      xPos += colWidths[2];
      doc.text(ql.heureRetour || '-', xPos, yPosition);
      xPos += colWidths[3];
      doc.text(ql.statut === 'en_cours' ? 'En cours' : 'Termine', xPos, yPosition);
      
      // Ligne de séparation
      doc.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
      doc.setLineWidth(0.2);
      doc.line(15, yPosition + 3, pageWidth - 15, yPosition + 3);
      
      yPosition += 10;
    });
    
    // Pied de page unifié
    addPdfFooter(doc);
    
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
      
      // En-tête unifié
      let yPosition = createPdfHeader(doc, {
        title: 'Feuille de Quartiers Libres',
        subtitle: 'Document vierge à remplir',
        showDate: true
      });
      
      // Champs à remplir
      doc.setFontSize(11);
      doc.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      doc.text('Date: ______________', 15, yPosition);
      doc.text('Heure de départ: ______________', 100, yPosition);
      
      yPosition += 15;
      
      // Titre de la liste
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
      doc.text('Liste des jeunes:', 15, yPosition);
      
      yPosition += 10;
      const lineHeight = 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      
      jeunes.forEach((jeune) => {
        yPosition = checkNewPage(doc, yPosition, lineHeight + 2);
        
        // Case à cocher
        doc.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
        doc.rect(15, yPosition - 3, 4, 4);
        
        // Nom du jeune
        doc.setFontSize(10);
        doc.text(`${jeune.prenom} ${jeune.nom}`, 25, yPosition);
        
        // Groupe QL
        doc.text('Groupe QL: ________________', 90, yPosition);
        
        // Heure de retour
        doc.text('Retour: ________', 160, yPosition);
        
        yPosition += lineHeight;
      });
      
      // Signature
      yPosition = checkNewPage(doc, yPosition, 20);
      doc.setFontSize(11);
      doc.text('Responsable: ________________________________', 15, yPosition + 10);
      
      // Pied de page unifié
      addPdfFooter(doc);
      
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
            <div className="mb-6 p-4 border rounded-lg bg-muted">
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
