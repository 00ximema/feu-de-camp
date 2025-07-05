
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, ArrowLeft, Download, Trash2, Edit, Upload, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { exportTeamToPDF } from "@/utils/teamPdfExporter";
import TeamMemberForm from "@/components/team/TeamMemberForm";
import DocumentManager from "@/components/team/DocumentManager";
import DocumentUploader from "@/components/team/DocumentUploader";

interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  email: string;
  role: string;
  diplomes: string[];
  notes: string;
  createdAt: string;
  documents?: TeamDocument[];
}

interface TeamDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  data?: string;
}

const Equipe = () => {
  const { team, addMember, updateMember, deleteMember, addDocument, deleteDocument, downloadDocument } = useTeamManagement();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showDocuments, setShowDocuments] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState<string | null>(null);
  const { toast } = useToast();

  const [newMember, setNewMember] = useState({
    nom: "",
    prenom: "",
    age: "",
    telephone: "",
    email: "",
    role: "",
    diplomes: "",
    notes: ""
  });

  const roles = [
    "Directeur",
    "Directeur adjoint", 
    "Animateur",
    "Animateur stagiaire",
    "Assistant sanitaire",
    "Cuisinier",
    "Personnel de service",
    "Autre"
  ];

  const handleAddMember = () => {
    if (!newMember.nom || !newMember.prenom || !newMember.age || !newMember.role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom, prénom, âge et rôle",
        variant: "destructive"
      });
      return;
    }

    addMember({
      nom: newMember.nom,
      prenom: newMember.prenom,
      age: parseInt(newMember.age),
      telephone: newMember.telephone,
      email: newMember.email,
      role: newMember.role,
      diplomes: newMember.diplomes,
      notes: newMember.notes
    });

    setNewMember({
      nom: "",
      prenom: "",
      age: "",
      telephone: "",
      email: "",
      role: "",
      diplomes: "",
      notes: ""
    });
    setShowAddForm(false);
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;
    updateMember(editingMember);
    setEditingMember(null);
  };

  const handleFileUpload = (memberId: string, file: File) => {
    addDocument(memberId, file);
    setShowUploadDialog(null);
  };

  const handleExportToPDF = () => {
    if (team.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucun membre d'équipe à exporter",
        variant: "destructive"
      });
      return;
    }

    exportTeamToPDF(team);
    
    toast({
      title: "Export réussi",
      description: "Le fichier PDF a été téléchargé avec succès"
    });
  };

  const selectedMember = showDocuments ? team.find(m => m.id === showDocuments) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion de l'équipe</h1>
            </div>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour accueil
              </Button>
            </Link>
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
                  <span>Équipe ({team.length})</span>
                </CardTitle>
                <CardDescription>Gérez les membres de votre équipe d'animation</CardDescription>
              </div>
              <div className="flex gap-2">
                {team.length > 0 && (
                  <Button variant="outline" onClick={handleExportToPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </Button>
                )}
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un membre
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ajouter un membre d'équipe</DialogTitle>
                      <DialogDescription>
                        Ajoutez un nouveau membre à votre équipe
                      </DialogDescription>
                    </DialogHeader>
                    <TeamMemberForm
                      formData={newMember}
                      onFormDataChange={setNewMember}
                      onSubmit={handleAddMember}
                      roles={roles}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {team.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre d'équipe</h3>
                <p className="text-gray-500 mb-4">Commencez par ajouter des membres à votre équipe</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Âge</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Diplômes</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.prenom} {member.nom}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.role}</Badge>
                        </TableCell>
                        <TableCell>{member.age} ans</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {member.telephone && <div>{member.telephone}</div>}
                            {member.email && <div className="text-gray-500">{member.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {member.diplomes.length > 0 
                              ? member.diplomes.join(', ') 
                              : 'Aucun diplôme renseigné'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDocuments(member.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {member.documents?.length || 0}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowUploadDialog(member.id)}
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMember(member)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMember(member.id)}
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
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le membre d'équipe</DialogTitle>
              <DialogDescription>
                Modifiez les informations du membre
              </DialogDescription>
            </DialogHeader>
            {editingMember && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nom">Nom de famille</Label>
                    <Input
                      id="edit-nom"
                      value={editingMember.nom}
                      onChange={(e) => setEditingMember({ ...editingMember, nom: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-prenom">Prénom</Label>
                    <Input
                      id="edit-prenom"
                      value={editingMember.prenom}
                      onChange={(e) => setEditingMember({ ...editingMember, prenom: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-age">Âge</Label>
                    <Input
                      id="edit-age"
                      value={editingMember.age.toString()}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setEditingMember({ ...editingMember, age: parseInt(numericValue) || 0 });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-telephone">Téléphone</Label>
                    <Input
                      id="edit-telephone"
                      value={editingMember.telephone}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setEditingMember({ ...editingMember, telephone: numericValue });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select value={editingMember.role} onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-diplomes">Diplômes</Label>
                  <Input
                    id="edit-diplomes"
                    value={editingMember.diplomes.join(', ')}
                    onChange={(e) => setEditingMember({ 
                      ...editingMember, 
                      diplomes: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                    })}
                    placeholder="BAFA, BAFD... (séparés par des virgules)"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={editingMember.notes}
                    onChange={(e) => setEditingMember({ ...editingMember, notes: e.target.value })}
                    placeholder="Informations complémentaires..."
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handleUpdateMember}
                >
                  Mettre à jour
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Document Manager */}
        {selectedMember && (
          <DocumentManager
            documents={selectedMember.documents || []}
            onDeleteDocument={(docId) => deleteDocument(selectedMember.id, docId)}
            onDownloadDocument={downloadDocument}
            showDocuments={!!showDocuments}
            onClose={() => setShowDocuments(null)}
            memberName={`${selectedMember.prenom} ${selectedMember.nom}`}
          />
        )}

        {/* Document Uploader */}
        <DocumentUploader
          showUploadDialog={!!showUploadDialog}
          onClose={() => setShowUploadDialog(null)}
          onFileUpload={(file) => showUploadDialog && handleFileUpload(showUploadDialog, file)}
        />
      </main>
    </div>
  );
};

export default Equipe;
