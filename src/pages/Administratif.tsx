import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ArrowLeft, CheckSquare, Phone, AlertTriangle, Plus, Trash2, Edit, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Youngster } from "@/types/youngster";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';

const Administratif = () => {
  const [youngsters, setYoungsters] = useState<Youngster[]>([]);
  
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();
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
        {/* Encart exercice d'évacuation */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg text-orange-800">
              <Shield className="h-5 w-5" />
              <span>Exercice d'alerte et d'évacuation obligatoire</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-orange-700">
                Un exercice d'alerte et d'évacuation doit être obligatoirement effectué au début 
                du séjour avec les enfants. Cet exercice doit être consigné sur les registres de sécurité.
              </p>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="evacuation-exercise"
                  checked={exerciceEvacuationDone}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEvacuationExerciseValidation();
                    }
                  }}
                />
                <Label htmlFor="evacuation-exercise" className="text-sm font-medium">
                  {exerciceEvacuationDone ? "✓ Exercice effectué et consigné" : "Valider que l'exercice a été effectué"}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    checked={acmDocuments.registrePresence}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('registrePresence', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Registre de présence</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.planEvacuationConsignes}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('planEvacuationConsignes', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Plan des locaux et consignes d'évacuation</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.panneauInterdictionFumer}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('panneauInterdictionFumer', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Panneau d'interdiction de fumer dans les locaux</label>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.adressesUrgence}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('adressesUrgence', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Adresses et numéros de téléphone des services d'urgence</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.tableauTemperatures}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('tableauTemperatures', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Tableau des relevés de température sur les réfrigérateurs et congélateurs</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.menusSemaine}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('menusSemaine', checked as boolean)}
                  />
                  <label className="text-xs font-medium">Menus de la semaine</label>
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

      </main>
    </div>
  );
};

export default Administratif;
