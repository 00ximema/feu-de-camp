import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, ArrowLeft, Download, Trash2, Edit, FileText, Upload, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import jsPDF from 'jspdf';

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
  documents?: Document[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  data?: string; // Base64 data pour simuler le stockage
}

const Equipe = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
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

  // Charger l'équipe depuis le localStorage
  useEffect(() => {
    const savedTeam = localStorage.getItem('team-members');
    if (savedTeam) {
      try {
        setTeam(JSON.parse(savedTeam));
      } catch (error) {
        console.error('Erreur lors du chargement de l\'équipe:', error);
      }
    }
  }, []);

  // Sauvegarder l'équipe dans le localStorage
  const saveTeam = (updatedTeam: TeamMember[]) => {
    localStorage.setItem('team-members', JSON.stringify(updatedTeam));
    setTeam(updatedTeam);
  };

  const handleAddMember = () => {
    if (!newMember.nom || !newMember.prenom || !newMember.age || !newMember.role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom, prénom, âge et rôle",
        variant: "destructive"
      });
      return;
    }

    const member: TeamMember = {
      id: Date.now().toString(),
      nom: newMember.nom.toUpperCase(),
      prenom: newMember.prenom,
      age: parseInt(newMember.age),
      telephone: newMember.telephone,
      email: newMember.email,
      role: newMember.role,
      diplomes: newMember.diplomes.split(',').map(d => d.trim()).filter(d => d),
      notes: newMember.notes,
      createdAt: new Date().toISOString()
    };

    const updatedTeam = [...team, member];
    saveTeam(updatedTeam);

    toast({
      title: "Membre ajouté",
      description: `${newMember.prenom} ${newMember.nom} a été ajouté à l'équipe`
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

  const handleDeleteMember = (id: string) => {
    const updatedTeam = team.filter(member => member.id !== id);
    saveTeam(updatedTeam);
    toast({
      title: "Membre supprimé",
      description: "Le membre a été supprimé de l'équipe"
    });
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;

    const updatedTeam = team.map(member => 
      member.id === editingMember.id ? editingMember : member
    );
    saveTeam(updatedTeam);
    setEditingMember(null);
    toast({
      title: "Membre mis à jour",
      description: "Les informations ont été mises à jour avec succès"
    });
  };

  const handleFileUpload = (memberId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        uploadDate: new Date().toISOString(),
        data: e.target?.result as string
      };

      const updatedTeam = team.map(member => 
        member.id === memberId 
          ? { ...member, documents: [...(member.documents || []), newDocument] }
          : member
      );
      
      saveTeam(updatedTeam);
      setShowUploadDialog(null);
      
      toast({
        title: "Document ajouté",
        description: `${file.name} a été ajouté avec succès`
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (memberId: string, documentId: string) => {
    const updatedTeam = team.map(member => 
      member.id === memberId 
        ? { ...member, documents: member.documents?.filter(doc => doc.id !== documentId) || [] }
        : member
    );
    
    saveTeam(updatedTeam);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  };

  const handleDownloadDocument = (document: Document) => {
    if (document.data) {
      const link = document.createElement('a');
      link.href = document.data;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportTeamToPDF = () => {
    if (team.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucun membre d'équipe à exporter",
        variant: "destructive"
      });
      return;
    }

    const pdf = new jsPDF();
    
    // Header avec logo
    pdf.setFillColor(147, 51, 234);
    pdf.rect(0, 0, 210, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('MG', 15, 17);
    
    pdf.setFontSize(16);
    pdf.text('Liste de l\'Équipe', 50, 17);
    
    // Date et stats
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 35);
    pdf.text(`Total: ${team.length} membre${team.length > 1 ? 's' : ''}`, 15, 42);
    
    let yPosition = 55;
    
    team.forEach((member, index) => {
      // Titre du membre
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${member.prenom} ${member.nom}`, 15, yPosition);
      yPosition += 7;
      
      // Informations principales
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Rôle: ${member.role}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Âge: ${member.age} ans`, 20, yPosition);
      yPosition += 5;
      
      if (member.telephone) {
        pdf.text(`Téléphone: ${member.telephone}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (member.email) {
        pdf.text(`Email: ${member.email}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (member.diplomes.length > 0) {
        pdf.text(`Diplômes: ${member.diplomes.join(', ')}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (member.notes) {
        pdf.text(`Notes: ${member.notes}`, 20, yPosition);
        yPosition += 5;
      }
      
      yPosition += 8;
      
      // Nouvelle page si nécessaire
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
    });
    
    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i}/${pageCount}`, 180, 285);
      pdf.text('Fondation MG - Gestion de l\'Équipe', 15, 285);
    }
    
    pdf.save(`Equipe_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Export réussi",
      description: "Le fichier PDF a été téléchargé avec succès"
    });
  };

  // Fonction pour ne permettre que les chiffres
  const handleNumericInput = (value: string, field: 'age' | 'telephone') => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setNewMember({ ...newMember, [field]: numericValue });
  };

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
                  <Button variant="outline" onClick={exportTeamToPDF}>
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nom">Nom de famille</Label>
                          <Input
                            id="nom"
                            value={newMember.nom}
                            onChange={(e) => setNewMember({ ...newMember, nom: e.target.value.toUpperCase() })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="prenom">Prénom</Label>
                          <Input
                            id="prenom"
                            value={newMember.prenom}
                            onChange={(e) => setNewMember({ ...newMember, prenom: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="age">Âge</Label>
                          <Input
                            id="age"
                            value={newMember.age}
                            onChange={(e) => handleNumericInput(e.target.value, 'age')}
                            placeholder="25"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telephone">Téléphone</Label>
                          <Input
                            id="telephone"
                            value={newMember.telephone}
                            onChange={(e) => handleNumericInput(e.target.value, 'telephone')}
                            placeholder="0123456789"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Rôle</Label>
                        <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="diplomes">Diplômes</Label>
                        <Input
                          id="diplomes"
                          value={newMember.diplomes}
                          onChange={(e) => setNewMember({ ...newMember, diplomes: e.target.value })}
                          placeholder="BAFA, BAFD... (séparés par des virgules)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                          id="notes"
                          value={newMember.notes}
                          onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                          placeholder="Informations complémentaires..."
                        />
                      </div>
                      <Button 
                        className="w-full"
                        disabled={!newMember.nom || !newMember.prenom || !newMember.age || !newMember.role}
                        onClick={handleAddMember}
                      >
                        Ajouter le membre
                      </Button>
                    </div>
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
                              onClick={() => handleDeleteMember(member.id)}
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

        {/* Dialog de visualisation des documents */}
        <Dialog open={!!showDocuments} onOpenChange={() => setShowDocuments(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Documents</DialogTitle>
              <DialogDescription>
                {showDocuments && `Documents de ${team.find(m => m.id === showDocuments)?.prenom} ${team.find(m => m.id === showDocuments)?.nom}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {showDocuments && team.find(m => m.id === showDocuments)?.documents?.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        Ajouté le {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showDocuments && handleDeleteDocument(showDocuments, doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun document</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'upload de document */}
        <Dialog open={!!showUploadDialog} onOpenChange={() => setShowUploadDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
              <DialogDescription>
                Téléchargez un document pour ce membre (contrat, certificat, diplôme, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document">Sélectionner un fichier</Label>
                <Input
                  id="document"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && showUploadDialog) {
                      handleFileUpload(showUploadDialog, file);
                    }
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 5MB)
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Equipe;
