import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, ArrowLeft, CheckSquare, Phone, AlertTriangle, Plus, Trash2, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Youngster } from "@/types/youngster";
import { useEvents } from "@/hooks/useEvents";
import jsPDF from 'jspdf';

const Administratif = () => {
  const [youngsters, setYoungsters] = useState<Youngster[]>([]);
  const { events } = useEvents();
  const [checklistData, setChecklistData] = useState<{ [key: string]: { [key: string]: boolean } }>({});
  const [acmDocuments, setAcmDocuments] = useState<{ [key: string]: boolean }>({
    declarationACM: false,
    projetEducatif: false,
    projetPedagogique: false,
    reglementInterieur: false,
    registrePresence: false,
    planEvacuation: false,
    trousseSecours: false,
    protocoleSanitaire: false,
    assurances: false,
    conventionsPartenaires: false
  });
  
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, label: "Urgences médicales", number: "15", description: "SAMU" },
    { id: 2, label: "Pompiers", number: "18", description: "Pompiers/Secours" },
    { id: 3, label: "Police/Gendarmerie", number: "17", description: "Police nationale/Gendarmerie" },
    { id: 4, label: "Numéro d'urgence européen", number: "112", description: "Urgences" },
    { id: 5, label: "Hôpital le plus proche", number: "", description: "Centre Hospitalier" },
    { id: 6, label: "Pharmacie de garde", number: "", description: "Pharmacie" },
    { id: 7, label: "Mairie", number: "", description: "Services municipaux" },
    { id: 8, label: "Taxi local", number: "", description: "Transport" }
  ]);

  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<{id: number, label: string, number: string, description: string} | null>(null);

  const [hospitalDetails, setHospitalDetails] = useState({
    nom: "",
    adresse: "",
    telephone: ""
  });

  // Charger les jeunes depuis le localStorage au montage du composant
  useEffect(() => {
    const savedYoungsters = localStorage.getItem('imported-youngsters');
    if (savedYoungsters) {
      try {
        const parsedYoungsters = JSON.parse(savedYoungsters);
        setYoungsters(parsedYoungsters);
        
        // Initialiser les données de checklist
        const initialChecklistData: { [key: string]: { [key: string]: boolean } } = {};
        parsedYoungsters.forEach((youngster: Youngster) => {
          initialChecklistData[youngster.id] = {
            ficheRenseignements: false,
            ficheSanitaire: false,
            copieCNI: false,
            copieVaccins: false,
            autorisationSortieTerritory: false,
            copieCNIParents: false,
            autorisationQL: false
          };
        });
        setChecklistData(initialChecklistData);
      } catch (error) {
        console.error('Erreur lors du chargement des jeunes:', error);
      }
    }
  }, []);

  const handleCheckboxChange = (youngesterId: string, documentType: string, checked: boolean) => {
    setChecklistData(prev => ({
      ...prev,
      [youngesterId]: {
        ...prev[youngesterId],
        [documentType]: checked
      }
    }));
  };

  const handleAcmCheckboxChange = (documentType: string, checked: boolean) => {
    setAcmDocuments(prev => ({
      ...prev,
      [documentType]: checked
    }));
  };

  const handleEmergencyContactChange = (id: number, field: 'label' | 'number' | 'description', value: string) => {
    setEmergencyContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const addEmergencyContact = () => {
    const newId = Math.max(...emergencyContacts.map(c => c.id)) + 1;
    const newContact = {
      id: newId,
      label: "Nouveau contact",
      number: "",
      description: ""
    };
    setEmergencyContacts(prev => [...prev, newContact]);
    setSelectedContactId(newId.toString());
    setEditingContact(newContact);
    setIsEditing(true);
  };

  const removeEmergencyContact = (id: number) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id));
    if (editingContact?.id === id) {
      setEditingContact(null);
      setIsEditing(false);
    }
  };

  const startEditingContact = (contact: typeof emergencyContacts[0]) => {
    setEditingContact({...contact});
    setIsEditing(true);
    setSelectedContactId(contact.id.toString());
  };

  const saveEditingContact = () => {
    if (editingContact) {
      handleEmergencyContactChange(editingContact.id, 'label', editingContact.label);
      handleEmergencyContactChange(editingContact.id, 'number', editingContact.number);
      handleEmergencyContactChange(editingContact.id, 'description', editingContact.description);
    }
    setIsEditing(false);
    setEditingContact(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingContact(null);
  };

  const handleHospitalDetailsChange = (field: string, value: string) => {
    setHospitalDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save emergency contacts to localStorage
  useEffect(() => {
    localStorage.setItem('emergency-contacts', JSON.stringify(emergencyContacts));
    localStorage.setItem('hospital-details', JSON.stringify(hospitalDetails));
  }, [emergencyContacts, hospitalDetails]);

  // Load emergency contacts from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('emergency-contacts');
    const savedHospital = localStorage.getItem('hospital-details');
    
    if (savedContacts) {
      try {
        setEmergencyContacts(JSON.parse(savedContacts));
      } catch (error) {
        console.error('Erreur lors du chargement des contacts d\'urgence:', error);
      }
    }
    
    if (savedHospital) {
      try {
        setHospitalDetails(JSON.parse(savedHospital));
      } catch (error) {
        console.error('Erreur lors du chargement des détails hôpital:', error);
      }
    }
  }, []);

  const getCompletionPercentage = (youngesterId: string) => {
    const youngsterChecklist = checklistData[youngesterId];
    if (!youngsterChecklist) return 0;
    
    const totalItems = Object.keys(youngsterChecklist).length;
    const completedItems = Object.values(youngsterChecklist).filter(Boolean).length;
    
    return Math.round((completedItems / totalItems) * 100);
  };

  const exportInfirmerieReportToPDF = () => {
    const pdf = new jsPDF();
    
    // Header avec logo
    pdf.setFillColor(147, 51, 234);
    pdf.rect(0, 0, 210, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('MG', 15, 17);
    
    pdf.setFontSize(16);
    pdf.text('Rapport Infirmerie et Événements', 50, 17);
    
    // Date
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 35);
    
    let yPosition = 50;
    
    // Récupérer les données d'infirmerie depuis le localStorage
    const infirmerieData = localStorage.getItem('infirmerie-data');
    
    if (infirmerieData) {
      const data = JSON.parse(infirmerieData);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DONNÉES INFIRMERIE', 15, yPosition);
      yPosition += 15;
      
      // Ajouter les soins dispensés
      if (data.soins && data.soins.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SOINS DISPENSÉS:', 15, yPosition);
        yPosition += 10;
        
        data.soins.forEach((soin: any, index: number) => {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${soin.date} - ${soin.youngsterName}`, 20, yPosition);
          yPosition += 6;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Symptômes: ${soin.symptomes}`, 25, yPosition);
          yPosition += 5;
          pdf.text(`Traitement: ${soin.traitement}`, 25, yPosition);
          yPosition += 5;
          pdf.text(`Animateur: ${soin.animateur}`, 25, yPosition);
          yPosition += 8;
          
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
      
      // Ajouter les traitements en cours
      if (data.traitements && data.traitements.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TRAITEMENTS EN COURS:', 15, yPosition);
        yPosition += 10;
        
        data.traitements.forEach((traitement: any, index: number) => {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${traitement.youngsterName}`, 20, yPosition);
          yPosition += 6;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Médicament: ${traitement.medicament}`, 25, yPosition);
          yPosition += 5;
          pdf.text(`Posologie: ${traitement.posologie}`, 25, yPosition);
          yPosition += 5;
          pdf.text(`Fréquence: ${traitement.frequence}`, 25, yPosition);
          yPosition += 8;
          
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
    }
    
    // Ajouter les événements des jeunes
    if (events.length > 0) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ÉVÉNEMENTS JEUNES', 15, yPosition);
      yPosition += 15;
      
      // Grouper les événements par jeune
      const eventsByYoungster: { [key: string]: any[] } = {};
      events.forEach(event => {
        if (!eventsByYoungster[event.youngsterName]) {
          eventsByYoungster[event.youngsterName] = [];
        }
        eventsByYoungster[event.youngsterName].push(event);
      });
      
      // Ajouter les événements groupés au rapport
      Object.entries(eventsByYoungster).forEach(([youngsterName, youngsterEvents]) => {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`JEUNE: ${youngsterName}`, 15, yPosition);
        yPosition += 8;
        
        youngsterEvents.forEach((event: any, index: number) => {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${index + 1}. ${event.date} - ${event.type}`, 20, yPosition);
          yPosition += 5;
          pdf.text(`Description: ${event.description}`, 25, yPosition);
          yPosition += 7;
          
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
        });
        yPosition += 5;
      });
    }
    
    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i}/${pageCount}`, 180, 285);
      pdf.text('Fondation MG - Rapport Administratif', 15, 285);
    }
    
    pdf.save(`Rapport_Infirmerie_Evenements_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion administrative</h1>
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
        {/* Numéros d'urgence */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Phone className="h-4 w-4 text-red-600" />
              <span>Numéros d'urgence du séjour</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Personnalisez et complétez les contacts importants pour votre séjour
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contacts d'urgence */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Contacts d'urgence</h3>
                <Button onClick={addEmergencyContact} size="sm" className="h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              <div className="space-y-2">
                {/* Liste compacte des contacts */}
                <div className="grid gap-2">
                  {emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">{contact.label}</span>
                          <span className="text-gray-400">-</span>
                          <span className="font-mono text-xs">{contact.number || "Non renseigné"}</span>
                          <span className="text-xs text-gray-500">({contact.description})</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => startEditingContact(contact)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => removeEmergencyContact(contact.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulaire d'édition compact */}
                {isEditing && editingContact && (
                  <div className="p-3 border rounded-lg bg-white">
                    <h4 className="font-medium mb-2 text-sm">Modifier le contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div>
                        <Label htmlFor="edit-label" className="text-xs">Libellé</Label>
                        <Input
                          id="edit-label"
                          className="h-8 text-sm"
                          value={editingContact.label}
                          onChange={(e) => setEditingContact(prev => prev ? {...prev, label: e.target.value} : null)}
                          placeholder="Ex: Urgences médicales"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-number" className="text-xs">Numéro</Label>
                        <Input
                          id="edit-number"
                          className="h-8 text-sm"
                          value={editingContact.number}
                          onChange={(e) => setEditingContact(prev => prev ? {...prev, number: e.target.value} : null)}
                          placeholder="Ex: 15"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-description" className="text-xs">Description</Label>
                        <Input
                          id="edit-description"
                          className="h-8 text-sm"
                          value={editingContact.description}
                          onChange={(e) => setEditingContact(prev => prev ? {...prev, description: e.target.value} : null)}
                          placeholder="Ex: SAMU"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={saveEditingContact} size="sm" className="h-7 text-xs">
                        Sauvegarder
                      </Button>
                      <Button onClick={cancelEditing} variant="outline" size="sm" className="h-7 text-xs">
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Détails hôpital compact */}
            <div>
              <h3 className="text-base font-semibold mb-3">Hôpital le plus proche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="hopital-nom" className="text-xs">Nom de l'établissement</Label>
                  <Input
                    id="hopital-nom"
                    className="h-8 text-sm"
                    value={hospitalDetails.nom}
                    onChange={(e) => handleHospitalDetailsChange('nom', e.target.value)}
                    placeholder="Centre Hospitalier..."
                  />
                </div>
                <div>
                  <Label htmlFor="hopital-tel" className="text-xs">Téléphone</Label>
                  <Input
                    id="hopital-tel"
                    className="h-8 text-sm"
                    value={hospitalDetails.telephone}
                    onChange={(e) => handleHospitalDetailsChange('telephone', e.target.value)}
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="hopital-adresse" className="text-xs">Adresse complète</Label>
                  <Textarea
                    id="hopital-adresse"
                    className="text-sm"
                    value={hospitalDetails.adresse}
                    onChange={(e) => handleHospitalDetailsChange('adresse', e.target.value)}
                    placeholder="Adresse complète de l'hôpital avec code postal et ville"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-List Documents ACM */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span>Documents obligatoires ACM</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Vérifiez que tous les documents obligatoires sont présents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.declarationACM}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('declarationACM', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Déclaration ACM</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.projetEducatif}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('projetEducatif', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Projet éducatif</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.projetPedagogique}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('projetPedagogique', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Projet pédagogique</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.reglementInterieur}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('reglementInterieur', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Règlement intérieur</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.registrePresence}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('registrePresence', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Registre de présence</label>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.planEvacuation}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('planEvacuation', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Plan d'évacuation</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.trousseSecours}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('trousseSecours', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Trousse de secours</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.protocoleSanitaire}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('protocoleSanitaire', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Protocole sanitaire</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.assurances}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('assurances', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Assurances</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.conventionsPartenaires}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('conventionsPartenaires', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Conventions partenaires</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-List Table - Only show if youngsters are imported */}
        {youngsters.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CheckSquare className="h-4 w-4" />
                <span>Check-List Documents ({youngsters.length} jeunes)</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Suivi des documents administratifs pour chaque jeune
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px] py-2">Nom du jeune</TableHead>
                      <TableHead className="text-center py-2 text-xs">Fiche de renseignements</TableHead>
                      <TableHead className="text-center py-2 text-xs">Fiche sanitaire de liaison</TableHead>
                      <TableHead className="text-center py-2 text-xs">Copie CNI</TableHead>
                      <TableHead className="text-center py-2 text-xs">Copie des vaccins</TableHead>
                      <TableHead className="text-center py-2 text-xs">Autorisation de sortie de territoire</TableHead>
                      <TableHead className="text-center py-2 text-xs">Copie CNI parents</TableHead>
                      <TableHead className="text-center py-2 text-xs">Autorisation QL</TableHead>
                      <TableHead className="text-center py-2 text-xs">Progression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {youngsters.map((youngster) => (
                      <TableRow key={youngster.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium py-2">
                          <div>
                            <div className="font-semibold text-sm">{youngster.prenom} {youngster.nom}</div>
                            <div className="text-xs text-gray-500">{youngster.age} ans</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheRenseignements || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'ficheRenseignements', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheSanitaire || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'ficheSanitaire', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNI || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieCNI', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieVaccins || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieVaccins', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.autorisationSortieTerritory || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'autorisationSortieTerritory', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNIParents || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieCNIParents', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Checkbox
                            checked={checklistData[youngster.id]?.autorisationQL || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'autorisationQL', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  getCompletionPercentage(youngster.id) === 100 
                                    ? 'bg-green-500' 
                                    : getCompletionPercentage(youngster.id) > 50 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${getCompletionPercentage(youngster.id)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {getCompletionPercentage(youngster.id)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <p>
                  <span className="font-medium">Note :</span> Cette liste se base sur les jeunes importés dans la section "Gestion des jeunes". 
                  Importez d'abord votre fichier Excel dans cette section pour voir apparaître la check-list.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rapport Infirmerie */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Download className="h-4 w-4" />
              <span>Rapport infirmerie et événements</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Générer le rapport complet au format PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportInfirmerieReportToPDF}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le rapport PDF
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Exporte tous les soins dispensés, traitements en cours et événements enregistrés pour les jeunes
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Administratif;
