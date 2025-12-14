import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Users, UserCheck, Building, DollarSign, Globe, Save, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useToast } from "@/hooks/use-toast";
import campfireIcon from "@/assets/campfire-icon.png";
import jsPDF from "jspdf";
import { createPdfHeader, addPdfFooter, PDF_COLORS, addWrappedText, checkNewPage } from "@/utils/pdfTemplate";

interface RapportData {
  id: string;
  sessionId: string;
  directeur: string;
  session: string;
  dateDebut: string;
  dateFin: string;
  // Section Enfants
  enfantsEffectifGarcons: string;
  enfantsEffectifFilles: string;
  enfantsCapaciteAccueil: string;
  enfantsVieQuotidienne: string;
  enfantsActivites: string;
  enfantsSante: string;
  enfantsProblemesSolutions: string;
  // Section Adultes
  adultesNombreAnimateurs: string;
  adultesQualification: string;
  adultesParticipation: string;
  adultesConditionsTravail: string;
  adultesRelationsEnfants: string;
  adultesRelationsAdultes: string;
  adultesOrganisationEquipe: string;
  adultesAmeliorations: string;
  // Section Équipements
  equipementsLocaux: string;
  equipementsCommodites: string;
  equipementsMaterielPedagogique: string;
  equipementsMaterielAchete: string;
  equipementsSuggestionsAchats: string;
  equipementsVehicules: string;
  equipementsRemarques: string;
  // Section Gestion
  gestionPrixJournee: string;
  gestionQualiteRepas: string;
  gestionCompteRenduFinancier: string;
  gestionComparaisonBudget: string;
  gestionConclusionsFinancieres: string;
  // Section Relations
  relationsFamilles: string;
  relationsPrestataires: string;
  relationsPartenaires: string;
  relationsServicesOfficiels: string;
  relationsModifications: string;
  relationsPersonnesRemerciees: string;
  relationsRemerciementsSiege: string;
  // Conclusion
  conclusion: string;
  createdAt: string;
  updatedAt: string;
}

const RapportFonctionnement = () => {
  const { currentSession } = useSession();
  const { isInitialized, db } = useLocalDatabase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("enfants");
  const [isSaving, setIsSaving] = useState(false);

  const [rapport, setRapport] = useState<RapportData>({
    id: "",
    sessionId: "",
    directeur: "",
    session: "",
    dateDebut: "",
    dateFin: "",
    enfantsEffectifGarcons: "",
    enfantsEffectifFilles: "",
    enfantsCapaciteAccueil: "",
    enfantsVieQuotidienne: "",
    enfantsActivites: "",
    enfantsSante: "",
    enfantsProblemesSolutions: "",
    adultesNombreAnimateurs: "",
    adultesQualification: "",
    adultesParticipation: "",
    adultesConditionsTravail: "",
    adultesRelationsEnfants: "",
    adultesRelationsAdultes: "",
    adultesOrganisationEquipe: "",
    adultesAmeliorations: "",
    equipementsLocaux: "",
    equipementsCommodites: "",
    equipementsMaterielPedagogique: "",
    equipementsMaterielAchete: "",
    equipementsSuggestionsAchats: "",
    equipementsVehicules: "",
    equipementsRemarques: "",
    gestionPrixJournee: "",
    gestionQualiteRepas: "",
    gestionCompteRenduFinancier: "",
    gestionComparaisonBudget: "",
    gestionConclusionsFinancieres: "",
    relationsFamilles: "",
    relationsPrestataires: "",
    relationsPartenaires: "",
    relationsServicesOfficiels: "",
    relationsModifications: "",
    relationsPersonnesRemerciees: "",
    relationsRemerciementsSiege: "",
    conclusion: "",
    createdAt: "",
    updatedAt: ""
  });

  useEffect(() => {
    loadRapport();
  }, [isInitialized, currentSession]);

  const loadRapport = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const rapports = await db.getAll("rapportsFonctionnement", currentSession.id);
      if (rapports.length > 0) {
        setRapport(rapports[0]);
      } else {
        setRapport(prev => ({
          ...prev,
          id: `rapport_${Date.now()}`,
          sessionId: currentSession.id,
          session: currentSession.name
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement du rapport:", error);
    }
  };

  const handleChange = (field: keyof RapportData, value: string) => {
    setRapport(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isInitialized || !currentSession) {
      toast({
        title: "Erreur",
        description: "La base de données n'est pas initialisée",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const rapportToSave = {
        ...rapport,
        sessionId: currentSession.id,
        updatedAt: new Date().toISOString(),
        createdAt: rapport.createdAt || new Date().toISOString()
      };

      await db.save("rapportsFonctionnement", rapportToSave);
      toast({
        title: "Rapport sauvegardé",
        description: "Le rapport de fonctionnement a été enregistré avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le rapport",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPosition = createPdfHeader(doc, { title: "Rapport de Fonctionnement", sessionName: rapport.session || currentSession?.name });

    // Infos générales
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
    doc.text(`Directeur: ${rapport.directeur || "Non renseigné"}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Session: ${rapport.session || currentSession?.name || "Non renseigné"}`, 20, yPosition);
    yPosition += 6;
    if (rapport.dateDebut && rapport.dateFin) {
      doc.text(`Période: du ${new Date(rapport.dateDebut).toLocaleDateString("fr-FR")} au ${new Date(rapport.dateFin).toLocaleDateString("fr-FR")}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 8;

    const addSection = (title: string, content: { label: string; value: string }[]) => {
      yPosition = checkNewPage(doc, yPosition, 40);
      
      doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.rect(15, yPosition - 4, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, yPosition + 1);
      yPosition += 10;

      doc.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      doc.setFontSize(9);

      content.forEach(item => {
        if (item.value && item.value.trim()) {
          yPosition = checkNewPage(doc, yPosition, 20);
          
          doc.setFont("helvetica", "bold");
          doc.text(item.label, 20, yPosition);
          yPosition += 5;

          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(item.value, 165);
          lines.forEach((line: string) => {
            yPosition = checkNewPage(doc, yPosition, 10);
            doc.text(line, 25, yPosition);
            yPosition += 4.5;
          });
          yPosition += 4;
        }
      });
      yPosition += 6;
    };

    // Section Les Enfants
    addSection("LES ENFANTS", [
      { label: "Effectif réalisé:", value: `Garçons: ${rapport.enfantsEffectifGarcons || "0"}, Filles: ${rapport.enfantsEffectifFilles || "0"}, Capacité: ${rapport.enfantsCapaciteAccueil || "Non renseigné"}` },
      { label: "La vie quotidienne:", value: rapport.enfantsVieQuotidienne },
      { label: "Les activités:", value: rapport.enfantsActivites },
      { label: "La santé des enfants:", value: rapport.enfantsSante },
      { label: "Problèmes et solutions envisagées:", value: rapport.enfantsProblemesSolutions }
    ]);

    // Section Les Adultes
    addSection("LES ADULTES", [
      { label: "Nombre et qualification:", value: `${rapport.adultesNombreAnimateurs || "0"} animateurs - ${rapport.adultesQualification || "Non renseigné"}` },
      { label: "Participation à la vie du centre:", value: rapport.adultesParticipation },
      { label: "Conditions de vie et de travail:", value: rapport.adultesConditionsTravail },
      { label: "Relations avec les enfants:", value: rapport.adultesRelationsEnfants },
      { label: "Relations entre adultes:", value: rapport.adultesRelationsAdultes },
      { label: "Organisation de l'équipe:", value: rapport.adultesOrganisationEquipe },
      { label: "Améliorations proposées:", value: rapport.adultesAmeliorations }
    ]);

    // Section Les Équipements
    addSection("LES ÉQUIPEMENTS", [
      { label: "Locaux et utilisation:", value: rapport.equipementsLocaux },
      { label: "Commodités et inconvénients:", value: rapport.equipementsCommodites },
      { label: "Matériel pédagogique:", value: rapport.equipementsMaterielPedagogique },
      { label: "Matériel acheté/jeté:", value: rapport.equipementsMaterielAchete },
      { label: "Suggestions d'achats:", value: rapport.equipementsSuggestionsAchats },
      { label: "Véhicules:", value: rapport.equipementsVehicules },
      { label: "Remarques et améliorations:", value: rapport.equipementsRemarques }
    ]);

    // Section Gestion Alimentaire et Financière
    addSection("LA GESTION ALIMENTAIRE ET FINANCIÈRE", [
      { label: "Prix de journée (autorisé/réalisé):", value: rapport.gestionPrixJournee },
      { label: "Qualité et quantité des repas:", value: rapport.gestionQualiteRepas },
      { label: "Compte rendu financier:", value: rapport.gestionCompteRenduFinancier },
      { label: "Comparaison avec le budget prévisionnel:", value: rapport.gestionComparaisonBudget },
      { label: "Conclusions financières:", value: rapport.gestionConclusionsFinancieres }
    ]);

    // Section Relations Extérieures
    addSection("LES RELATIONS EXTÉRIEURES", [
      { label: "Relations avec les familles:", value: rapport.relationsFamilles },
      { label: "Relations avec les prestataires:", value: rapport.relationsPrestataires },
      { label: "Relations avec les organismes partenaires:", value: rapport.relationsPartenaires },
      { label: "Relations avec les services officiels:", value: rapport.relationsServicesOfficiels },
      { label: "Modifications envisagées:", value: rapport.relationsModifications },
      { label: "Personnes remerciées par le directeur:", value: rapport.relationsPersonnesRemerciees },
      { label: "Personnes à remercier par le Siège:", value: rapport.relationsRemerciementsSiege }
    ]);

    // Conclusion
    addSection("CONCLUSION", [
      { label: "Conclusion générale:", value: rapport.conclusion }
    ]);

    addPdfFooter(doc);
    doc.save(`rapport-fonctionnement-${rapport.session || "session"}.pdf`);

    toast({
      title: "PDF généré",
      description: "Le rapport de fonctionnement a été exporté en PDF"
    });
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Veuillez sélectionner une session pour accéder au rapport de fonctionnement.
            </p>
            <Link to="/" className="block mt-4">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <img src={campfireIcon} alt="Feu de camp" className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Rapport de fonctionnement</h1>
                <p className="text-xs text-muted-foreground">Synthèse de fin de séjour</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button size="sm" onClick={generatePDF}>
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Informations générales */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Directeur/Directrice</Label>
                <Input
                  value={rapport.directeur}
                  onChange={(e) => handleChange("directeur", e.target.value)}
                  placeholder="Nom du directeur"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Session</Label>
                <Input
                  value={rapport.session || currentSession.name}
                  onChange={(e) => handleChange("session", e.target.value)}
                  placeholder="Nom de la session"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Date de début</Label>
                <Input
                  type="date"
                  value={rapport.dateDebut}
                  onChange={(e) => handleChange("dateDebut", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Date de fin</Label>
                <Input
                  type="date"
                  value={rapport.dateFin}
                  onChange={(e) => handleChange("dateFin", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets des sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-6 mb-4">
            <TabsTrigger value="enfants" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Enfants
            </TabsTrigger>
            <TabsTrigger value="adultes" className="text-xs">
              <UserCheck className="h-3 w-3 mr-1" />
              Adultes
            </TabsTrigger>
            <TabsTrigger value="equipements" className="text-xs">
              <Building className="h-3 w-3 mr-1" />
              Équipements
            </TabsTrigger>
            <TabsTrigger value="gestion" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Gestion
            </TabsTrigger>
            <TabsTrigger value="relations" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              Relations
            </TabsTrigger>
            <TabsTrigger value="conclusion" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Conclusion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enfants">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Les Enfants</CardTitle>
                <CardDescription className="text-xs">Effectif, vie quotidienne, activités et santé des enfants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Effectif Garçons</Label>
                    <Input
                      type="number"
                      value={rapport.enfantsEffectifGarcons}
                      onChange={(e) => handleChange("enfantsEffectifGarcons", e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Effectif Filles</Label>
                    <Input
                      type="number"
                      value={rapport.enfantsEffectifFilles}
                      onChange={(e) => handleChange("enfantsEffectifFilles", e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Capacité d'accueil totale</Label>
                    <Input
                      value={rapport.enfantsCapaciteAccueil}
                      onChange={(e) => handleChange("enfantsCapaciteAccueil", e.target.value)}
                      placeholder="Capacité maximale"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">La vie quotidienne</Label>
                  <Textarea
                    value={rapport.enfantsVieQuotidienne}
                    onChange={(e) => handleChange("enfantsVieQuotidienne", e.target.value)}
                    placeholder="Organisation, répercussions éventuelles sur les activités..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Les activités</Label>
                  <Textarea
                    value={rapport.enfantsActivites}
                    onChange={(e) => handleChange("enfantsActivites", e.target.value)}
                    placeholder="Organisation, déroulement..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">La santé des enfants</Label>
                  <Textarea
                    value={rapport.enfantsSante}
                    onChange={(e) => handleChange("enfantsSante", e.target.value)}
                    placeholder="État général à l'arrivée, au départ, influence du lieu, conditions matérielles..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Problèmes rencontrés et solutions envisagées</Label>
                  <Textarea
                    value={rapport.enfantsProblemesSolutions}
                    onChange={(e) => handleChange("enfantsProblemesSolutions", e.target.value)}
                    placeholder="En fonction des problèmes rencontrés, solutions envisagées pour les années à venir..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adultes">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Les Adultes</CardTitle>
                <CardDescription className="text-xs">Équipe d'encadrement, conditions et relations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nombre d'animateurs</Label>
                    <Input
                      type="number"
                      value={rapport.adultesNombreAnimateurs}
                      onChange={(e) => handleChange("adultesNombreAnimateurs", e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Qualification</Label>
                    <Input
                      value={rapport.adultesQualification}
                      onChange={(e) => handleChange("adultesQualification", e.target.value)}
                      placeholder="BAFA, stagiaires, etc."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Participation à la vie du centre</Label>
                  <Textarea
                    value={rapport.adultesParticipation}
                    onChange={(e) => handleChange("adultesParticipation", e.target.value)}
                    placeholder="Appréciation d'ensemble de la participation..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Conditions de vie et de travail</Label>
                  <Textarea
                    value={rapport.adultesConditionsTravail}
                    onChange={(e) => handleChange("adultesConditionsTravail", e.target.value)}
                    placeholder="Conditions au centre pour les animateurs, assistant sanitaire, personnels..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Relations avec les enfants</Label>
                    <Textarea
                      value={rapport.adultesRelationsEnfants}
                      onChange={(e) => handleChange("adultesRelationsEnfants", e.target.value)}
                      placeholder="Qualité des relations..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Relations entre adultes</Label>
                    <Textarea
                      value={rapport.adultesRelationsAdultes}
                      onChange={(e) => handleChange("adultesRelationsAdultes", e.target.value)}
                      placeholder="Ambiance d'équipe, communication..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Organisation de l'équipe de direction et d'animation</Label>
                  <Textarea
                    value={rapport.adultesOrganisationEquipe}
                    onChange={(e) => handleChange("adultesOrganisationEquipe", e.target.value)}
                    placeholder="Réflexions sur l'organisation du travail..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Améliorations proposées</Label>
                  <Textarea
                    value={rapport.adultesAmeliorations}
                    onChange={(e) => handleChange("adultesAmeliorations", e.target.value)}
                    placeholder="Tout ce qui peut aller dans le sens d'une amélioration future..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipements">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Les Équipements</CardTitle>
                <CardDescription className="text-xs">Locaux, matériel pédagogique et véhicules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Locaux et utilisation</Label>
                  <Textarea
                    value={rapport.equipementsLocaux}
                    onChange={(e) => handleChange("equipementsLocaux", e.target.value)}
                    placeholder="Locaux mis à disposition et leur utilisation, équipements fournis..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Commodités et inconvénients</Label>
                  <Textarea
                    value={rapport.equipementsCommodites}
                    onChange={(e) => handleChange("equipementsCommodites", e.target.value)}
                    placeholder="Restauration, hébergement, salle de veillée, propositions pour l'année prochaine..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Matériel pédagogique (inventaire et état)</Label>
                  <Textarea
                    value={rapport.equipementsMaterielPedagogique}
                    onChange={(e) => handleChange("equipementsMaterielPedagogique", e.target.value)}
                    placeholder="État du matériel pédagogique appartenant à la MG..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Matériel acheté ou jeté durant la session</Label>
                  <Textarea
                    value={rapport.equipementsMaterielAchete}
                    onChange={(e) => handleChange("equipementsMaterielAchete", e.target.value)}
                    placeholder="Gros matériel ou équipements coûteux (avec accord préalable du siège)..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Suggestions d'achats pour les années futures</Label>
                  <Textarea
                    value={rapport.equipementsSuggestionsAchats}
                    onChange={(e) => handleChange("equipementsSuggestionsAchats", e.target.value)}
                    placeholder="Matériel d'équipement pédagogique à moyen/long terme..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Véhicules</Label>
                  <Textarea
                    value={rapport.equipementsVehicules}
                    onChange={(e) => handleChange("equipementsVehicules", e.target.value)}
                    placeholder="Nombre de véhicules, places passager..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Remarques et améliorations proposées</Label>
                  <Textarea
                    value={rapport.equipementsRemarques}
                    onChange={(e) => handleChange("equipementsRemarques", e.target.value)}
                    placeholder="Remarques éventuelles..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gestion">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">La Gestion Alimentaire et Financière</CardTitle>
                <CardDescription className="text-xs">Alimentation, budget et compte rendu financier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Prix de journée (autorisé/réalisé)</Label>
                  <Input
                    value={rapport.gestionPrixJournee}
                    onChange={(e) => handleChange("gestionPrixJournee", e.target.value)}
                    placeholder="Ex: 45€ autorisé / 42€ réalisé"
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Qualité et quantité des repas</Label>
                  <Textarea
                    value={rapport.gestionQualiteRepas}
                    onChange={(e) => handleChange("gestionQualiteRepas", e.target.value)}
                    placeholder="Commentaires éventuels sur les 5èmes repas..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Compte rendu financier</Label>
                  <Textarea
                    value={rapport.gestionCompteRenduFinancier}
                    onChange={(e) => handleChange("gestionCompteRenduFinancier", e.target.value)}
                    placeholder="Commentaires sur les problèmes relatifs à la gestion financière..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Comparaison avec le budget prévisionnel</Label>
                  <Textarea
                    value={rapport.gestionComparaisonBudget}
                    onChange={(e) => handleChange("gestionComparaisonBudget", e.target.value)}
                    placeholder="Comparaison chapitre par chapitre, améliorations souhaitées..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Conclusions financières</Label>
                  <Textarea
                    value={rapport.gestionConclusionsFinancieres}
                    onChange={(e) => handleChange("gestionConclusionsFinancieres", e.target.value)}
                    placeholder="Points qui ont pu gêner le bon déroulement, propositions pour l'année suivante..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relations">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Les Relations Extérieures</CardTitle>
                <CardDescription className="text-xs">Relations avec les familles, prestataires et services officiels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Relations avec les familles</Label>
                  <Textarea
                    value={rapport.relationsFamilles}
                    onChange={(e) => handleChange("relationsFamilles", e.target.value)}
                    placeholder="Influence sur la vie des enfants au centre..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Relations avec les prestataires locaux</Label>
                  <Textarea
                    value={rapport.relationsPrestataires}
                    onChange={(e) => handleChange("relationsPrestataires", e.target.value)}
                    placeholder="Possibilités d'évolution..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Relations avec l'organisme partenaire</Label>
                  <Textarea
                    value={rapport.relationsPartenaires}
                    onChange={(e) => handleChange("relationsPartenaires", e.target.value)}
                    placeholder="Si séjour à l'étranger en partenariat..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Relations avec les services officiels</Label>
                  <Textarea
                    value={rapport.relationsServicesOfficiels}
                    onChange={(e) => handleChange("relationsServicesOfficiels", e.target.value)}
                    placeholder="Inspection J et S, Siège..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Modifications envisagées</Label>
                  <Textarea
                    value={rapport.relationsModifications}
                    onChange={(e) => handleChange("relationsModifications", e.target.value)}
                    placeholder="Modifications pour que ces relations agissent encore plus efficacement..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Personnes remerciées par le directeur</Label>
                  <Textarea
                    value={rapport.relationsPersonnesRemerciees}
                    onChange={(e) => handleChange("relationsPersonnesRemerciees", e.target.value)}
                    placeholder="Liste des personnes remerciées..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Personnes à remercier par le Siège (exceptionnel)</Label>
                  <Textarea
                    value={rapport.relationsRemerciementsSiege}
                    onChange={(e) => handleChange("relationsRemerciementsSiege", e.target.value)}
                    placeholder="Avis motivé..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conclusion">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Conclusion</CardTitle>
                <CardDescription className="text-xs">Synthèse générale du séjour</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-xs">Conclusion générale</Label>
                  <Textarea
                    value={rapport.conclusion}
                    onChange={(e) => handleChange("conclusion", e.target.value)}
                    placeholder="Synthèse de l'effort de l'équipe d'encadrement, conclusions générales du séjour, réflexions de tous ceux qui ont collaboré à son déroulement..."
                    rows={10}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RapportFonctionnement;