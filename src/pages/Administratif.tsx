import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ArrowLeft, CheckSquare, Phone, AlertTriangle, Plus, Trash2, Edit, Shield, Upload, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Youngster } from "@/types/youngster";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';
import { useAcmDocuments } from '@/hooks/useAcmDocuments';
import AcmDocumentUploader from '@/components/acm/AcmDocumentUploader';
import AcmDocumentManager from '@/components/acm/AcmDocumentManager';

const Administratif = () => {
  const [youngsters, setYoungsters] = useState<Youngster[]>([]);
  
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();
  const { acmDocuments: acmDocumentFiles, addDocument, deleteDocument, downloadDocument } = useAcmDocuments();
  const [checklistData, setChecklistData] = useState<{ [key: string]: { [key: string]: boolean } }>({});
  const [exerciceEvacuationDone, setExerciceEvacuationDone] = useState(false);
  const [acmDocuments, setAcmDocuments] = useState({
    declarationACM: false,
    projetEducatif: false,
    projetPedagogique: false,
    registrePresence: false,
    planEvacuationConsignes: false,
    panneauInterdictionFumer: false,
    adressesUrgence: false,
    tableauTemperatures: false,
    menusSemaine: false,
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
    { id: 8, label: "Taxi local", number: "", description: "Transport" },
    { id: 9, label: "Centre Antipoison", number: "01 40 05 48 48", description: "Centre antipoison" },
    { id: 10, label: "Allo enfance maltraitée", number: "119", description: "Enfance en danger" }
  ]);

  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<{id: number, label: string, number: string, description: string} | null>(null);

  const [hospitalDetails, setHospitalDetails] = useState({
    nom: "",
    adresse: "",
    telephone: ""
  });

  // États pour la gestion des documents ACM
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [selectedDocumentLabel, setSelectedDocumentLabel] = useState("");

  // Charger les données administratives et les jeunes depuis la base de données
  useEffect(() => {
    if (isInitialized && currentSession) {
      loadAdministrativeData();
      loadYoungsters();
    }
  }, [isInitialized, currentSession]);

  const loadYoungsters = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const savedYoungsters = await db.getAll('jeunes', currentSession.id);
      setYoungsters(savedYoungsters as Youngster[]);
      
      // Initialiser les données de checklist
      const initialChecklistData: { [key: string]: { [key: string]: boolean } } = {};
      savedYoungsters.forEach((youngster) => {
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
  };

  const loadAdministrativeData = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const adminData = await db.getAll('administratif', currentSession.id);
      if (adminData.length > 0) {
        const data = adminData[0];
        setExerciceEvacuationDone(data.exerciceEvacuationDone || false);
        setEmergencyContacts(data.emergencyContacts);
        setHospitalDetails(data.hospitalDetails);
        setAcmDocuments(data.acmDocuments);
        if (data.checklistData) {
          setChecklistData(data.checklistData);
        }
      } else {
        // Pour une nouvelle session, l'exercice est décoché par défaut
        setExerciceEvacuationDone(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données administratives:', error);
    }
  };

  const saveAdministrativeData = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const adminData = {
        id: `admin_${currentSession.id}`,
        sessionId: currentSession.id,
        exerciceEvacuationDone,
        emergencyContacts,
        hospitalDetails,
        acmDocuments,
        checklistData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.save('administratif', adminData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données administratives:', error);
    }
  };

  const handleCheckboxChange = async (youngesterId: string, documentType: string, checked: boolean) => {
    const newChecklistData = {
      ...checklistData,
      [youngesterId]: {
        ...checklistData[youngesterId],
        [documentType]: checked
      }
    };
    setChecklistData(newChecklistData);
    await saveAdministrativeData();
  };

  const handleAcmCheckboxChange = async (documentType: string, checked: boolean) => {
    const newAcmDocuments = {
      ...acmDocuments,
      [documentType]: checked
    };
    setAcmDocuments(newAcmDocuments);
    await saveAdministrativeData();
  };

  const handleEmergencyContactChange = async (id: number, field: 'label' | 'number' | 'description', value: string) => {
    const newContacts = emergencyContacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    );
    setEmergencyContacts(newContacts);
    await saveAdministrativeData();
  };

  const addEmergencyContact = async () => {
    const newId = Math.max(...emergencyContacts.map(c => c.id)) + 1;
    const newContact = {
      id: newId,
      label: "Nouveau contact",
      number: "",
      description: ""
    };
    const newContacts = [...emergencyContacts, newContact];
    setEmergencyContacts(newContacts);
    setSelectedContactId(newId.toString());
    setEditingContact(newContact);
    setIsEditing(true);
    await saveAdministrativeData();
  };

  const removeEmergencyContact = async (id: number) => {
    const newContacts = emergencyContacts.filter(contact => contact.id !== id);
    setEmergencyContacts(newContacts);
    if (editingContact?.id === id) {
      setEditingContact(null);
      setIsEditing(false);
    }
    await saveAdministrativeData();
  };

  const startEditingContact = (contact: typeof emergencyContacts[0]) => {
    setEditingContact({...contact});
    setIsEditing(true);
    setSelectedContactId(contact.id.toString());
  };

  const saveEditingContact = async () => {
    if (editingContact) {
      await handleEmergencyContactChange(editingContact.id, 'label', editingContact.label);
      await handleEmergencyContactChange(editingContact.id, 'number', editingContact.number);
      await handleEmergencyContactChange(editingContact.id, 'description', editingContact.description);
    }
    setIsEditing(false);
    setEditingContact(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingContact(null);
  };

  const handleHospitalDetailsChange = async (field: string, value: string) => {
    const newHospitalDetails = {
      ...hospitalDetails,
      [field]: value
    };
    setHospitalDetails(newHospitalDetails);
    await saveAdministrativeData();
  };

  // Sauvegarder automatiquement quand les données changent
  useEffect(() => {
    if (isInitialized && currentSession) {
      saveAdministrativeData();
    }
  }, [exerciceEvacuationDone, emergencyContacts, hospitalDetails, acmDocuments, checklistData, isInitialized, currentSession]);

  const getCompletionPercentage = (youngesterId: string) => {
    const youngsterChecklist = checklistData[youngesterId];
    if (!youngsterChecklist) return 0;
    
    const totalItems = Object.keys(youngsterChecklist).length;
    const completedItems = Object.values(youngsterChecklist).filter(Boolean).length;
    
    return Math.round((completedItems / totalItems) * 100);
  };

  const handleEvacuationExerciseValidation = async () => {
    setExerciceEvacuationDone(true);
    await saveAdministrativeData();
    toast({
      title: "Exercice validé",
      description: "L'exercice d'évacuation a été marqué comme effectué"
    });
  };


  return (
    <div className="min-h-screen bg-background font-admin">
      <header className="bg-card shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Gestion administrative</h1>
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
        {/* Encart exercice d'évacuation */}
        <Card className="mb-4 border-warning/20 bg-warning/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Exercice d'alerte et d'évacuation obligatoire</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="evacuation-exercise"
                  checked={exerciceEvacuationDone}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEvacuationExerciseValidation();
                    }
                  }}
                />
                <Label htmlFor="evacuation-exercise" className="text-xs">
                  {exerciceEvacuationDone ? "✓ Effectué" : "Valider"}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Numéros d'urgence */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Phone className="h-4 w-4 text-destructive" />
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
                    <div key={contact.id} className="flex items-center justify-between p-2 border rounded bg-muted">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">{contact.label}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className={contact.number ? "font-medium" : "text-muted-foreground italic"}>
                            {contact.number || "Non renseigné"}
                          </span>
                          {contact.description && (
                            <span className="text-muted-foreground">({contact.description})</span>
                          )}
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
                  <div className="p-3 border rounded-lg bg-card">
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
          </CardContent>
        </Card>

        {/* Documents obligatoires ACM */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-4 w-4 text-primary" />
              <span>Documents obligatoires ACM</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Vérifiez la présence de tous les documents obligatoires et téléchargez-les
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries({
                declarationACM: "Déclaration ACM",
                projetEducatif: "Projet éducatif",
                projetPedagogique: "Projet pédagogique",
                registrePresence: "Registre de présence",
                planEvacuationConsignes: "Plan d'évacuation et consignes",
                panneauInterdictionFumer: "Panneau interdiction de fumer",
                adressesUrgence: "Adresses et téléphones d'urgence",
                tableauTemperatures: "Tableau des températures",
                menusSemaine: "Menus de la semaine",
                protocoleSanitaire: "Protocole sanitaire",
                assurances: "Assurances",
                conventionsPartenaires: "Conventions avec partenaires"
              }).map(([key, label]) => {
                const documentCount = acmDocumentFiles.filter(doc => doc.documentType === key).length;
                return (
                  <div key={key} className="flex items-center justify-between p-2 border rounded bg-muted">
                    <div className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        id={key}
                        checked={acmDocuments[key as keyof typeof acmDocuments]}
                        onCheckedChange={(checked) => handleAcmCheckboxChange(key, !!checked)}
                      />
                      <Label htmlFor={key} className="font-medium cursor-pointer">
                        {label}
                      </Label>
                      {documentCount > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {documentCount} doc{documentCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setSelectedDocumentType(key);
                          setSelectedDocumentLabel(label);
                          setShowUploadDialog(true);
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                      {documentCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedDocumentType(key);
                            setSelectedDocumentLabel(label);
                            setShowDocumentsDialog(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Check-List Table - Only show if youngsters are imported */}
        {youngsters.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span>Check-List documents des jeunes</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Cochez les documents reçus pour chaque jeune
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Jeune</TableHead>
                      <TableHead className="text-center">Fiche renseignements</TableHead>
                      <TableHead className="text-center">Fiche sanitaire</TableHead>
                      <TableHead className="text-center">Copie CNI jeune</TableHead>
                      <TableHead className="text-center">Copie vaccins</TableHead>
                      <TableHead className="text-center">Autorisation sortie territoire</TableHead>
                      <TableHead className="text-center">Copie CNI parents</TableHead>
                      <TableHead className="text-center">Autorisation QL</TableHead>
                      <TableHead className="text-center">Progression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {youngsters.map((youngster) => (
                      <TableRow key={youngster.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-sm font-medium">{youngster.prenom} {youngster.nom}</div>
                            <div className="text-xs text-gray-500">{youngster.age} ans</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheRenseignements || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'ficheRenseignements', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheSanitaire || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'ficheSanitaire', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNI || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'copieCNI', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieVaccins || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'copieVaccins', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.autorisationSortieTerritory || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'autorisationSortieTerritory', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNIParents || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'copieCNIParents', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.autorisationQL || false}
                            onCheckedChange={(checked) => handleCheckboxChange(youngster.id, 'autorisationQL', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium">
                              {getCompletionPercentage(youngster.id)}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${getCompletionPercentage(youngster.id)}%` }}
                              ></div>
                            </div>
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

        {/* Dialogs de gestion des documents ACM */}
        <AcmDocumentUploader
          showUploadDialog={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onFileUpload={async (file, documentType) => {
            try {
              await addDocument(file, documentType);
              setShowUploadDialog(false);
            } catch (error) {
              console.error('Erreur lors de l\'upload:', error);
            }
          }}
          documentType={selectedDocumentType}
          documentLabel={selectedDocumentLabel}
        />

        <AcmDocumentManager
          documents={acmDocumentFiles}
          onDeleteDocument={deleteDocument}
          onDownloadDocument={downloadDocument}
          showDocuments={showDocumentsDialog}
          onClose={() => setShowDocumentsDialog(false)}
          documentType={selectedDocumentType}
          documentLabel={selectedDocumentLabel}
        />
      </main>
    </div>
  );
};

export default Administratif;