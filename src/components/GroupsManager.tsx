
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Edit, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGroups, GroupeJeunes } from "@/hooks/useGroups";
import { useJeunes } from "@/hooks/useJeunes";

const GroupsManager = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupeJeunes | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState<GroupeJeunes | null>(null);
  const { toast } = useToast();
  const { groupes, addGroupe, updateGroupe, deleteGroupe, addJeuneToGroupe, removeJeuneFromGroupe } = useGroups();
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
      </CardHeader>
      <CardContent>
        {groupes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun groupe créé</h3>
            <p className="text-gray-500 mb-4">Commencez par créer votre premier groupe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupes.map((groupe) => (
              <div key={groupe.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={groupe.couleur} variant="secondary">
                    {groupe.nom}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowMembersDialog(groupe)}
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(groupe.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {groupe.description && (
                  <p className="text-sm text-gray-600 mb-2">{groupe.description}</p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{groupe.jeunesIds.length} jeune{groupe.jeunesIds.length !== 1 ? 's' : ''}</span>
                </div>
                {groupe.jeunesIds.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {getJeunesInGroup(groupe.id).slice(0, 3).map(jeune => (
                      <div key={jeune.id} className="text-xs text-gray-600">
                        {jeune.prenom} {jeune.nom}
                      </div>
                    ))}
                    {groupe.jeunesIds.length > 3 && (
                      <div className="text-xs text-gray-500">
                        et {groupe.jeunesIds.length - 3} autre{groupe.jeunesIds.length - 3 !== 1 ? 's' : ''}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dialog pour gérer les membres du groupe - fenêtre plus grande */}
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
                        <div key={jeune.id} className="flex items-center justify-between p-3 bg-green-50 rounded border">
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
                        <div key={jeune.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
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
