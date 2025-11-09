import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, FileText, Calendar, Calculator, Building, Clock, AlertCircle, Pill, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import SessionManager from "@/components/SessionManager";
import { useSession } from "@/hooks/useSession";
import { useJeunes } from "@/hooks/useJeunes";
import { useEvents } from "@/hooks/useEvents";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";

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
  const [latestEvent, setLatestEvent] = useState<any>(null);

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
    loadLatestMainCouranteEvent();
  }, [isInitialized, db, currentSession]);

  const loadLatestMainCouranteEvent = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const events = await db.getAll('mainCouranteEvents', currentSession.id);
      const sortedEvents = events.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      if (sortedEvents.length > 0) {
        setLatestEvent(sortedEvents[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements main courante:', error);
    }
  };

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
    },
    {
      id: 7,
      title: "Main courante",
      description: "Enregistrement des événements et incidents avec les personnes concernées",
      icon: BookOpen,
      route: "/main-courante",
      color: "bg-indigo-500 hover:bg-indigo-600"
    }
  ];

  // Si aucune session n'est sélectionnée, afficher un message d'invite
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-background">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md shadow-soft border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src="/lovable-uploads/450370f1-5749-44c5-8da4-6670c288f50c.png" 
                    alt="Logo Fondation Maison de la Gendarmerie" 
                    className="h-16 w-auto cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => window.open('https://fondationmg.fr/', '_blank')}
                    title="Visiter fondationmg.fr"
                  />
                  <div className="absolute -inset-2 bg-gradient-primary rounded-full opacity-20 blur-xl"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Gestion CVJ MG
                  </h1>
                  <p className="text-muted-foreground">Plateforme de gestion pour les directeurs</p>
                </div>
              </div>
              
              {/* Session Manager */}
              <SessionManager />
            </div>
          </div>
        </header>

        {/* Message d'invite pour créer une session */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-4 bg-gradient-primary rounded-full opacity-20 blur-2xl"></div>
              <div className="relative p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border/20">
                <Calendar className="h-20 w-20 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Créez votre première session pour commencer
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
              Pour utiliser l'application de gestion CVJ MG, vous devez d'abord créer une session de séjour. 
              Une session correspond à une période de colonie (été, vacances de Pâques, etc.).
            </p>
            <div className="relative max-w-md mx-auto">
              <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-card backdrop-blur-sm border border-border/20 rounded-xl p-6 shadow-large">
                <h3 className="font-semibold text-foreground mb-4 text-lg">Pour commencer :</h3>
                <ol className="text-left text-muted-foreground space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                    <span>Cliquez sur le sélecteur de session en haut à droite</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                    <span>Sélectionnez "Créer une nouvelle session"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                    <span>Donnez un nom à votre session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</span>
                    <span>Commencez à utiliser l'application !</span>
                  </li>
                </ol>
              </div>
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
                <p className="text-sm text-muted-foreground">Plateforme de gestion pour les directeurs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DataManager />
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
            <h3 className="text-2xl font-semibold text-foreground mb-8 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-primary rounded-full"></div>
              Aperçu rapide
            </h3>
          
          {/* Traitements actifs */}
          <div className="mb-8">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              Traitements actifs
            </h4>
            {traitementsActifs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {traitementsActifs.map((traitement) => (
                  <div key={traitement.id} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative text-sm p-4 bg-card rounded-lg border border-border/50 shadow-soft hover:shadow-medium transition-all">
                      <div className="font-semibold text-foreground mb-1">
                        {traitement.jeuneNom}
                      </div>
                      <div className="text-primary font-medium mb-2">{traitement.medicament}</div>
                      <div className="text-muted-foreground text-xs">
                        {traitement.posologie} · Jusqu'au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-border/30">
                Aucun traitement actif
              </div>
            )}
          </div>

          {/* Informations sur le personnel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Astreintes */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-5"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-sm">Astreintes</span>
                </h4>
                {astreintes.length > 0 ? (
                  <div className="space-y-2">
                    {astreintes.map((member, index) => (
                      <div key={index} className="text-sm p-3 bg-muted/50 rounded-md border border-border/30">
                        <div className="font-medium text-foreground">
                          {member.prenom} {member.nom}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">{member.role}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Aucune astreinte</div>
                )}
              </div>
            </div>

            {/* Congés */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-5"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">Congés</span>
                </h4>
                {conges.length > 0 ? (
                  <div className="space-y-2">
                    {conges.map((member, index) => (
                      <div key={index} className="text-sm p-3 bg-muted/50 rounded-md border border-border/30">
                        <div className="font-medium text-foreground">
                          {member.prenom} {member.nom}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">{member.role}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Aucun congé</div>
                )}
              </div>
            </div>

            {/* Repos récupérateurs */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-5"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-accent/50">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">Repos</span>
                </h4>
                {reposRecuperateurs.length > 0 ? (
                  <div className="space-y-2">
                    {reposRecuperateurs.map((member, index) => (
                      <div key={index} className="text-sm p-3 bg-muted/50 rounded-md border border-border/30">
                        <div className="font-medium text-foreground">
                          {member.prenom} {member.nom}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">{member.role}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Aucun repos</div>
                )}
              </div>
            </div>

            {/* Main courante */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-lg opacity-5"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-accent/50">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">Dernier événement</span>
                </h4>
                {latestEvent ? (
                  <div className="text-sm p-3 bg-muted/50 rounded-md border border-border/30">
                    <div className="font-medium text-foreground mb-1">
                      {new Date(latestEvent.date + 'T' + latestEvent.time).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-muted-foreground text-xs line-clamp-2">{latestEvent.description}</div>
                    {(latestEvent.selectedMembers.length > 0 || latestEvent.selectedJeunes.length > 0) && (
                      <div className="text-primary text-xs mt-1 font-medium">
                        {latestEvent.selectedMembers.length + latestEvent.selectedJeunes.length} personne(s)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Aucun événement</div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
