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
import campfireIcon from "@/assets/campfire-icon.png";

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={campfireIcon} alt="Feu de camp" className="h-10 w-auto" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Feu de camp
                  </h1>
                  <p className="text-xs text-muted-foreground">Plateforme de gestion pour les directeurs</p>
                </div>
              </div>
              
              <SessionManager />
            </div>
          </div>
        </header>

        {/* Message d'invite pour créer une session */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/5 mb-8">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Créez votre première session
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
              Pour utiliser l'application, créez d'abord une session de séjour correspondant à votre période de colonie.
            </p>
            <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="font-semibold text-foreground mb-6 text-lg">Comment démarrer :</h3>
              <ol className="text-left text-muted-foreground space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</span>
                  <span className="pt-1">Cliquez sur le sélecteur de session en haut à droite</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</span>
                  <span className="pt-1">Sélectionnez "Créer une nouvelle session"</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">3</span>
                  <span className="pt-1">Donnez un nom à votre session</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">4</span>
                  <span className="pt-1">Commencez à utiliser l'application !</span>
                </li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={campfireIcon} alt="Feu de camp" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Feu de camp
                </h1>
                <p className="text-xs text-muted-foreground">Plateforme de gestion pour les directeurs</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DataManager />
              <SessionManager />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="mb-3">
          <div className="inline-flex items-center px-2 py-1 bg-primary/5 rounded-full mb-2">
            <span className="text-xs font-semibold text-primary">{currentSession.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
            Tableau de bord
          </h2>
          <p className="text-muted-foreground text-sm">Accédez à tous les modules de gestion</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Link key={module.id} to={module.route}>
                <Card className="group h-full bg-card border border-border hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground mb-1">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex items-center text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                      Accéder <span className="ml-1">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-4">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Aperçu rapide
            </h3>
          
          {/* Traitements actifs */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/5">
                <Pill className="h-4 w-4 text-primary" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Traitements actifs</h4>
            </div>
            {traitementsActifs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {traitementsActifs.map((traitement) => (
                  <div key={traitement.id} className="group p-2 bg-card rounded-xl border border-border hover:border-primary hover:shadow-md transition-all">
                    <div className="font-bold text-foreground text-xs mb-1">
                      {traitement.jeuneNom}
                    </div>
                    <div className="text-primary font-semibold text-xs mb-1">{traitement.medicament}</div>
                    <div className="text-muted-foreground text-xs">
                      {traitement.posologie} · Jusqu'au {new Date(traitement.dateFin).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs p-2 bg-card rounded-xl border border-border">
                Aucun traitement actif
              </div>
            )}
          </div>

          {/* Informations sur le personnel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Astreintes */}
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-lg bg-destructive/5">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                </div>
                <h4 className="font-bold text-foreground text-xs">Astreintes</h4>
              </div>
              {astreintes.length > 0 ? (
                <div className="space-y-2">
                  {astreintes.map((member, index) => (
                    <div key={index} className="p-2 bg-background rounded-lg border border-border">
                      <div className="font-semibold text-foreground text-xs">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-muted-foreground text-xs">{member.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucune astreinte</div>
              )}
            </div>

            {/* Congés */}
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-lg bg-primary/10">
                  <Calendar className="h-3 w-3 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-xs">Congés</h4>
              </div>
              {conges.length > 0 ? (
                <div className="space-y-2">
                  {conges.map((member, index) => (
                    <div key={index} className="text-xs p-2 bg-card rounded-lg border border-border">
                      <div className="font-medium text-foreground">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-muted-foreground text-xs">{member.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucun congé</div>
              )}
            </div>

            {/* Repos récupérateurs */}
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-lg bg-success/5">
                  <UserCheck className="h-3 w-3 text-success" />
                </div>
                <h4 className="font-bold text-foreground text-xs">Repos</h4>
              </div>
              {reposRecuperateurs.length > 0 ? (
                <div className="space-y-2">
                  {reposRecuperateurs.map((member, index) => (
                    <div key={index} className="p-2 bg-background rounded-lg border border-border">
                      <div className="font-semibold text-foreground text-xs">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-muted-foreground text-xs">{member.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucun repos</div>
              )}
            </div>

            {/* Main courante */}
            <div className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-lg bg-info/5">
                  <BookOpen className="h-3 w-3 text-info" />
                </div>
                <h4 className="font-bold text-foreground text-xs">Dernier événement</h4>
              </div>
              {latestEvent ? (
                <div className="p-2 bg-background rounded-lg border border-border">
                  <div className="font-semibold text-foreground mb-1 text-xs">
                    {new Date(latestEvent.date + 'T' + latestEvent.time).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-muted-foreground text-xs line-clamp-2">{latestEvent.description}</div>
                  {(latestEvent.selectedMembers.length > 0 || latestEvent.selectedJeunes.length > 0) && (
                    <div className="text-primary text-xs mt-1 font-semibold">
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
      </main>
    </div>
  );
};

export default Index;
