import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, FileText, Calendar, Calculator, Building, Clock, AlertCircle, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import SessionManager from "@/components/SessionManager";
import { useSession } from "@/hooks/useSession";
import { useJeunes } from "@/hooks/useJeunes";
import { useEvents } from "@/hooks/useEvents";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import ClickableLogo from "@/components/ClickableLogo";
import DataManager from "@/components/DataManager";

interface Animateur {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

// Updated Planning interface to match database structure
interface Planning {
  id: string;
  sessionId?: string;
  data: Array<Array<{
    date: string;
    timeSlot: string;
    event?: {
      id: string;
      name: string;
      type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
      assignedMembers?: Array<{
        id: string;
        nom: string;
        prenom: string;
        role: string;
      }>;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
      selectedGroups?: string[];
      selectedJeunes?: string[];
    };
  }>>;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Traitement {
  id: string;
  jeuneId: string;
  jeuneNom: string;
  medicament: string;
  posologie: string;
  duree: string;
  dateDebut: string;
  dateFin: string;
  instructions?: string;
  ordonnance: boolean;
  dateCreation: string;
}

const Index = () => {
  const { currentSession } = useSession();
  const { jeunes } = useJeunes();
  const { events } = useEvents();
  const { isInitialized, db } = useLocalDatabase();
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [traitements, setTraitements] = useState<Traitement[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!isInitialized || !currentSession) return;
      
      try {
        // Charger les animateurs de la session courante
        const dbAnimateurs = await db.getAll('animateurs', currentSession.id);
        setAnimateurs(dbAnimateurs);

        // Charger les plannings de la session courante
        const dbPlannings = await db.getAll('plannings', currentSession.id);
        setPlannings(dbPlannings);

        // Charger les traitements de la session courante
        const dbTraitements = await db.getAll('traitements', currentSession.id);
        setTraitements(dbTraitements);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();
  }, [isInitialized, db, currentSession]);

  const today = new Date().toISOString().split('T')[0];

  const getTraitementsActifs = () => {
    return traitements.filter(t => t.dateDebut <= today && t.dateFin >= today);
  };

  const getAstreintes = () => {
    return plannings
      .flatMap(p => p.data.flat())
      .filter(slot => slot.date === today && slot.timeSlot === 'Astreintes' && slot.event?.assignedMembers && slot.event.assignedMembers.length > 0)
      .flatMap(slot => slot.event?.assignedMembers || []);
  };

  const getConges = () => {
    return plannings
      .flatMap(p => p.data.flat())
      .filter(slot => slot.date === today && slot.timeSlot === 'Congés' && slot.event?.assignedMembers && slot.event.assignedMembers.length > 0)
      .flatMap(slot => slot.event?.assignedMembers || []);
  };

  const getReposRecuperateurs = () => {
    return plannings
      .flatMap(p => p.data.flat())
      .filter(slot => slot.date === today && slot.timeSlot === 'Repos récupérateurs' && slot.event?.assignedMembers && slot.event.assignedMembers.length > 0)
      .flatMap(slot => slot.event?.assignedMembers || []);
  };

  const traitementsActifs = getTraitementsActifs();
  const astreintes = getAstreintes();
  const conges = getConges();
  const reposRecuperateurs = getReposRecuperateurs();

  const modules = [
    {
      id: 1,
      title: "Gestion des jeunes",
      description: "Importer la liste des jeunes, événements médicaux, suivi individualisé",
      icon: Users,
      route: "/jeunes",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      id: 2,
      title: "Gestion de l'équipe",
      description: "Fiches animateurs, intégration des contrats, vaccins et diplômes",
      icon: UserCheck,
      route: "/equipe",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      id: 3,
      title: "Gestion administrative",
      description: "Projet pédagogique, documents directeurs",
      icon: FileText,
      route: "/administratif",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      id: 4,
      title: "Gestion du planning",
      description: "Repos animateurs, astreintes, planning personnalisé",
      icon: Calendar,
      route: "/planning",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      id: 5,
      title: "Gestion comptable",
      description: "Gestion financière, import Excel, budgets",
      icon: Calculator,
      route: "/comptabilite",
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      id: 6,
      title: "Gestion de l'infirmerie",
      description: "Suivi médical, traitements, soins et consultations",
      icon: Building,
      route: "/infirmerie",
      color: "bg-teal-500 hover:bg-teal-600"
    }
  ];

  // Si aucune session n'est sélectionnée, afficher un message d'invite
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="/lovable-uploads/450370f1-5749-44c5-8da4-6670c288f50c.png" 
                  alt="Logo Fondation Maison de la Gendarmerie" 
                  className="h-16 w-auto"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Gestion CVJ MG</h1>
                  <p className="text-gray-600">Plateforme de gestion des ACM</p>
                </div>
              </div>
              
              {/* Session Manager */}
              <SessionManager />
            </div>
          </div>
        </header>

        {/* Message d'invite pour créer une session */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
              <Calendar className="h-24 w-24" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Créez votre première session pour commencer
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Pour utiliser l'application de gestion CVJ MG, vous devez d'abord créer une session de séjour. 
              Une session correspond à une période de colonie (été, vacances de Pâques, etc.).
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-medium text-blue-900 mb-2">Pour commencer :</h3>
              <ol className="text-left text-blue-800 space-y-1">
                <li>1. Cliquez sur le sélecteur de session en haut à droite</li>
                <li>2. Sélectionnez "Créer une nouvelle session"</li>
                <li>3. Donnez un nom à votre session</li>
                <li>4. Commencez à utiliser l'application !</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-md shadow-soft border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src="/lovable-uploads/450370f1-5749-44c5-8da4-6670c288f50c.png" 
                  alt="Logo Fondation Maison de la Gendarmerie" 
                  className="h-14 w-auto cursor-pointer transition-all duration-300 hover:scale-105"
                  onClick={() => window.open('https://fondationmg.fr/', '_blank')}
                  title="Visiter fondationmg.fr"
                />
                <div className="absolute -inset-2 bg-gradient-primary rounded-full opacity-20 blur-xl"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Gestion CVJ MG
                </h1>
                <p className="text-sm text-muted-foreground">Plateforme de gestion des ACM</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DataManager />
              <ClickableLogo />
              <SessionManager />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-3">
            Tableau de bord
          </h2>
          <div className="text-lg text-primary font-medium">
            {currentSession.name}
          </div>
          <p className="text-muted-foreground mt-2">Accédez à tous les modules de gestion de votre colonie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div key={module.id} className="group relative">
                <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative bg-gradient-card backdrop-blur-sm border-border/20 hover:shadow-large transition-all duration-500 group-hover:scale-[1.02]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-bold text-primary/30">0{module.id}</div>
                    </div>
                    <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={module.route}>
                      <Button className="w-full bg-gradient-primary hover:bg-gradient-secondary text-primary-foreground shadow-medium hover:shadow-large transition-all duration-300 font-medium">
                        Accéder au module
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-16 relative">
          <div className="absolute -inset-1 bg-gradient-secondary rounded-2xl blur opacity-10"></div>
          <div className="relative bg-gradient-card backdrop-blur-sm rounded-2xl shadow-large border border-border/20 p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Aperçu rapide</h3>
          
          {/* Traitements actifs */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Pill className="h-4 w-4 mr-2 text-teal-600" />
              Traitements actifs
            </h4>
            {traitementsActifs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {traitementsActifs.map((traitement) => (
                  <div key={traitement.id} className="text-sm p-3 bg-teal-50 rounded border-l-2 border-teal-200">
                    <div className="font-medium text-teal-900">
                      {traitement.jeuneNom}
                    </div>
                    <div className="text-teal-700">{traitement.medicament}</div>
                    <div className="text-teal-600 text-xs">
                      {traitement.posologie} - Jusqu'au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Aucun traitement actif</div>
            )}
          </div>

          {/* Informations sur le personnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Astreintes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                Astreintes aujourd'hui
              </h4>
              {astreintes.length > 0 ? (
                <div className="space-y-2">
                  {astreintes.map((member, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-200">
                      <div className="font-medium text-red-900">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-red-600 text-xs">{member.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucune astreinte définie</div>
              )}
            </div>

            {/* Congés */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Congés aujourd'hui
              </h4>
              {conges.length > 0 ? (
                <div className="space-y-2">
                  {conges.map((member, index) => (
                    <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                      <div className="font-medium text-blue-900">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-blue-600 text-xs">{member.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucun congé défini</div>
              )}
            </div>

            {/* Repos récupérateurs */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-green-600" />
                Repos récupérateurs
              </h4>
              {reposRecuperateurs.length > 0 ? (
                <div className="space-y-2">
                  {reposRecuperateurs.map((member, index) => (
                    <div key={index} className="text-sm p-2 bg-green-50 rounded border-l-2 border-green-200">
                      <div className="font-medium text-green-900">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-green-600 text-xs">{member.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucun repos récupérateur défini</div>
              )}
            </div>
           </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
