
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, UserPlus, UserMinus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGroups, GroupeJeunes } from "@/hooks/useGroups";
import { useJeunes } from "@/hooks/useJeunes";
import jsPDF from 'jspdf';
import { createPdfHeader, addPdfFooter, checkNewPage, PDF_COLORS } from "@/utils/pdfTemplate";

const GroupsManager = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState<GroupeJeunes | null>(null);
  const { toast } = useToast();
  const { groupes, addGroupe, deleteGroupe, addJeuneToGroupe, removeJeuneFromGroupe } = useGroups();
  const { jeunes } = useJeunes();

  const [newGroup, setNewGroup] = useState({
    nom: '',
    description: '',
    couleur: 'bg-blue-100 text-blue-800'
  });

  const couleurs = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-pink-100 text-pink-800',
    'bg-orange-100 text-orange-800',
    'bg-gray-100 text-gray-800'
  ];

  const handleAddGroup = async () => {
    if (!newGroup.nom) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour le groupe",
        variant: "destructive"
      });
      return;
    }

    const result = await addGroupe({
      nom: newGroup.nom,
      description: newGroup.description,
      couleur: newGroup.couleur,
      jeunesIds: []
    });

    if (result) {
      toast({
        title: "Groupe créé",
        description: `Le groupe "${newGroup.nom}" a été créé avec succès`
      });
      setNewGroup({ nom: '', description: '', couleur: 'bg-blue-100 text-blue-800' });
      setShowAddForm(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const result = await deleteGroupe(id);
    if (result) {
      toast({
        title: "Groupe supprimé",
        description: "Le groupe a été supprimé avec succès"
      });
    }
  };

  const getJeunesInGroup = (groupeId: string) => {
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe) return [];
    return jeunes.filter(j => groupe.jeunesIds.includes(j.id));
  };

  const getJeunesNotInGroup = (groupeId: string) => {
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe) return jeunes;
    return jeunes.filter(j => !groupe.jeunesIds.includes(j.id));
  };

  const handleCloseMembersDialog = () => {
    setShowMembersDialog(null);
    toast({
      title: "Modifications enregistrées",
      description: "Les membres du groupe ont été mis à jour"
    });
  };

  const exportGroupsToPDF = () => {
    const pdf = new jsPDF();
    
    // En-tête uniforme
    let yPosition = createPdfHeader(pdf, {
      title: 'Groupes de Jeunes',
      subtitle: `${groupes.length} groupe${groupes.length > 1 ? 's' : ''} enregistré${groupes.length > 1 ? 's' : ''}`
    });
    
    if (groupes.length === 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
      pdf.text('Aucun groupe créé', 15, yPosition);
    } else {
      groupes.forEach((groupe, index) => {
        // Vérifier si on a besoin d'une nouvelle page
        yPosition = checkNewPage(pdf, yPosition, 40);
        
        // Titre du groupe
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
        pdf.text(`${index + 1}. ${groupe.nom}`, 15, yPosition);
        yPosition += 8;
        
        // Description
        if (groupe.description) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
          pdf.text(`Description: ${groupe.description}`, 20, yPosition);
          yPosition += 6;
        }
        
        // Membres
        const membresGroupe = getJeunesInGroup(groupe.id);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
        pdf.text(`Membres (${membresGroupe.length}):`, 20, yPosition);
        yPosition += 6;
        
        if (membresGroupe.length === 0) {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
          pdf.text('Aucun membre', 25, yPosition);
          yPosition += 6;
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
          membresGroupe.forEach((jeune) => {
            yPosition = checkNewPage(pdf, yPosition, 6);
            pdf.text(`• ${jeune.prenom} ${jeune.nom} (${jeune.age} ans)`, 25, yPosition);
            yPosition += 5;
          });
        }
        
        yPosition += 10;
        
        // Ligne de séparation entre groupes
        if (index < groupes.length - 1) {
          pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
          pdf.setLineWidth(0.2);
          pdf.line(20, yPosition - 5, 190, yPosition - 5);
        }
      });
    }
    
    // Pied de page uniforme
    addPdfFooter(pdf);
    
    pdf.save(`Groupes_Jeunes_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Export réussi",
      description: "Le fichier PDF a été téléchargé avec succès"
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Groupes de jeunes ({groupes.length})</span>
            </CardTitle>
            <CardDescription>Créez et gérez des groupes pour organiser les activités</CardDescription>
          </div>
          <div className="flex space-x-2">
            {groupes.length > 0 && (
              <Button variant="outline" onClick={exportGroupsToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            )}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau groupe
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau groupe</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau groupe de jeunes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom du groupe</Label>
                    <Input
                      id="nom"
                      value={newGroup.nom}
                      onChange={(e) => setNewGroup({ ...newGroup, nom: e.target.value })}
                      placeholder="ex: Groupe Ski"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Description du groupe..."
                    />
                  </div>
                  <div>
                    <Label>Couleur</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {couleurs.map(couleur => (
                        <button
                          key={couleur}
                          className={`w-8 h-8 rounded border-2 ${couleur} ${
                            newGroup.couleur === couleur ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          onClick={() => setNewGroup({ ...newGroup, couleur })}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    disabled={!newGroup.nom}
                    onClick={handleAddGroup}
                  >
                    Créer le groupe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {groupes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun groupe créé</h3>
            <p className="text-gray-500 mb-4">Commencez par créer votre premier groupe</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupes.map((groupe) => {
                  const membresGroupe = getJeunesInGroup(groupe.id);
                  return (
                    <TableRow key={groupe.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={groupe.couleur} variant="secondary">
                            {groupe.nom}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {groupe.description || 'Aucune description'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{groupe.jeunesIds.length} jeune{groupe.jeunesIds.length !== 1 ? 's' : ''}</span>
                          </div>
                          {membresGroupe.length > 0 ? (
                            <div className="text-xs space-y-1">
                              {membresGroupe.map(jeune => (
                                <div key={jeune.id} className="text-gray-600">
                                  {jeune.prenom} {jeune.nom}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Aucun membre</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowMembersDialog(groupe)}
                            title="Gérer les membres"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGroup(groupe.id)}
                            title="Supprimer le groupe"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog pour gérer les membres du groupe */}
        <Dialog open={!!showMembersDialog} onOpenChange={() => setShowMembersDialog(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Gérer les membres - {showMembersDialog?.nom}</DialogTitle>
              <DialogDescription>
                Ajoutez ou retirez des jeunes de ce groupe
              </DialogDescription>
            </DialogHeader>
            {showMembersDialog && (
              <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
                {/* Jeunes dans le groupe */}
                <div>
                  <h4 className="font-medium mb-3">Membres du groupe ({getJeunesInGroup(showMembersDialog.id).length})</h4>
                  {getJeunesInGroup(showMembersDialog.id).length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun membre dans ce groupe</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                      {getJeunesInGroup(showMembersDialog.id).map(jeune => (
                        <div key={jeune.id} className="flex items-center justify-between p-3 bg-card rounded border">
                          <span className="text-sm font-medium">{jeune.prenom} {jeune.nom}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeJeuneFromGroupe(showMembersDialog.id, jeune.id)}
                          >
                            <UserMinus className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jeunes disponibles */}
                <div>
                  <h4 className="font-medium mb-3">Jeunes disponibles ({getJeunesNotInGroup(showMembersDialog.id).length})</h4>
                  {getJeunesNotInGroup(showMembersDialog.id).length === 0 ? (
                    <p className="text-gray-500 text-sm">Tous les jeunes sont déjà dans ce groupe</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                      {getJeunesNotInGroup(showMembersDialog.id).map(jeune => (
                        <div key={jeune.id} className="flex items-center justify-between p-3 bg-card rounded border">
                          <span className="text-sm">{jeune.prenom} {jeune.nom}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addJeuneToGroupe(showMembersDialog.id, jeune.id)}
                          >
                            <UserPlus className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button onClick={handleCloseMembersDialog} className="bg-green-600 hover:bg-green-700">
                Valider les modifications
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default GroupsManager;
