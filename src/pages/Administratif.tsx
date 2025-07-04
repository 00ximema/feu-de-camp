import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, ArrowLeft, CheckSquare, Phone, AlertTriangle } from "lucide-react";
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
  
  const [emergencyNumbers, setEmergencyNumbers] = useState({
    urgencesMedicales: "15",
    pompiers: "18",
    hopitalNom: "",
    hopitalAdresse: "",
    hopitalTelephone: "",
    autresNumeros: ""
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
            autorisationSortie: false,
            copieCNIParents: false
          };
        });
        setChecklistData(initialChecklistData);
      } catch (error) {
        console.error('Erreur lors du chargement des jeunes:', error);
      }
    }

    // Charger les numéros d'urgence
    const savedEmergencyNumbers = localStorage.getItem('emergency-numbers');
    if (savedEmergencyNumbers) {
      try {
        setEmergencyNumbers(JSON.parse(savedEmergencyNumbers));
      } catch (error) {
        console.error('Erreur lors du chargement des numéros d\'urgence:', error);
      }
    }
  }, []);

  // Sauvegarder les numéros d'urgence
  useEffect(() => {
    localStorage.setItem('emergency-numbers', JSON.stringify(emergencyNumbers));
  }, [emergencyNumbers]);

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

  const handleEmergencyNumberChange = (field: string, value: string) => {
    setEmergencyNumbers(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-red-600" />
              <span>Numéros d'urgence du séjour</span>
            </CardTitle>
            <CardDescription>
              Renseignez les contacts importants pour votre séjour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgences">Urgences médicales</Label>
                <Input
                  id="urgences"
                  value={emergencyNumbers.urgencesMedicales}
                  onChange={(e) => handleEmergencyNumberChange('urgencesMedicales', e.target.value)}
                  placeholder="15"
                />
              </div>
              <div>
                <Label htmlFor="pompiers">Pompiers</Label>
                <Input
                  id="pompiers"
                  value={emergencyNumbers.pompiers}
                  onChange={(e) => handleEmergencyNumberChange('pompiers', e.target.value)}
                  placeholder="18"
                />
              </div>
              <div>
                <Label htmlFor="hopital-nom">Hôpital le plus proche - Nom</Label>
                <Input
                  id="hopital-nom"
                  value={emergencyNumbers.hopitalNom}
                  onChange={(e) => handleEmergencyNumberChange('hopitalNom', e.target.value)}
                  placeholder="Centre Hospitalier..."
                />
              </div>
              <div>
                <Label htmlFor="hopital-tel">Hôpital - Téléphone</Label>
                <Input
                  id="hopital-tel"
                  value={emergencyNumbers.hopitalTelephone}
                  onChange={(e) => handleEmergencyNumberChange('hopitalTelephone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="hopital-adresse">Hôpital - Adresse</Label>
                <Input
                  id="hopital-adresse"
                  value={emergencyNumbers.hopitalAdresse}
                  onChange={(e) => handleEmergencyNumberChange('hopitalAdresse', e.target.value)}
                  placeholder="Adresse complète de l'hôpital"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="autres-numeros">Autres numéros importants</Label>
                <Textarea
                  id="autres-numeros"
                  value={emergencyNumbers.autresNumeros}
                  onChange={(e) => handleEmergencyNumberChange('autresNumeros', e.target.value)}
                  placeholder="Mairie, Police locale, Taxi, autres contacts utiles..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-List Documents ACM */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Documents obligatoires ACM</span>
            </CardTitle>
            <CardDescription>
              Vérifiez que tous les documents obligatoires sont présents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.declarationACM}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('declarationACM', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Déclaration ACM</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.projetEducatif}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('projetEducatif', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Projet éducatif</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.projetPedagogique}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('projetPedagogique', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Projet pédagogique</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.reglementInterieur}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('reglementInterieur', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Règlement intérieur</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.registrePresence}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('registrePresence', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Registre de présence</label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.planEvacuation}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('planEvacuation', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Plan d'évacuation</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.trousseSecours}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('trousseSecours', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Trousse de secours</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.protocoleSanitaire}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('protocoleSanitaire', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Protocole sanitaire</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.assurances}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('assurances', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Assurances</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={acmDocuments.conventionsPartenaires}
                    onCheckedChange={(checked) => handleAcmCheckboxChange('conventionsPartenaires', checked as boolean)}
                  />
                  <label className="text-sm font-medium">Conventions partenaires</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-List Table - Only show if youngsters are imported */}
        {youngsters.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Check-List Documents ({youngsters.length} jeunes)</span>
              </CardTitle>
              <CardDescription>
                Suivi des documents administratifs pour chaque jeune
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nom du jeune</TableHead>
                      <TableHead className="text-center">Fiche de renseignements</TableHead>
                      <TableHead className="text-center">Fiche sanitaire de liaison</TableHead>
                      <TableHead className="text-center">Copie CNI</TableHead>
                      <TableHead className="text-center">Copie des vaccins</TableHead>
                      <TableHead className="text-center">Autorisation de sortie</TableHead>
                      <TableHead className="text-center">Copie CNI parents</TableHead>
                      <TableHead className="text-center">Progression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {youngsters.map((youngster) => (
                      <TableRow key={youngster.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{youngster.prenom} {youngster.nom}</div>
                            <div className="text-sm text-gray-500">{youngster.age} ans</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheRenseignements || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'ficheRenseignements', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheSanitaire || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'ficheSanitaire', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNI || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieCNI', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieVaccins || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieVaccins', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.autorisationSortie || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'autorisationSortie', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNIParents || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieCNIParents', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
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
              <div className="mt-4 text-sm text-gray-600">
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
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Rapport infirmerie et événements</span>
            </CardTitle>
            <CardDescription>
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
