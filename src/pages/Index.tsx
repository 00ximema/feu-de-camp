
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, FileText, Calendar, Calculator, Building, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface Animateur {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

interface Planning {
  date: string;
  animateurs: {
    id: number;
    heureDebut: string;
    heureFin: string;
    typeService: string;
  }[];
}

interface Event {
  id: string;
  youngesterId: string;
  youngsterName: string;
  type: string;
  description: string;
  date: string;
}

const Index = () => {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Charger les animateurs
    const savedAnimateurs = localStorage.getItem('equipe-animateurs');
    if (savedAnimateurs) {
      setAnimateurs(JSON.parse(savedAnimateurs));
    }

    // Charger les plannings
    const savedPlannings = localStorage.getItem('plannings');
    if (savedPlannings) {
      setPlannings(JSON.parse(savedPlannings));
    }

    // Charger les événements
    const savedEvents = localStorage.getItem('youngster-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const getTodayPlanning = () => {
    return plannings.find(p => p.date === today);
  };

  const getTomorrowPlanning = () => {
    return plannings.find(p => p.date === tomorrow);
  };

  const getTodayEvents = () => {
    return events.filter(event => event.date === new Date().toLocaleDateString('fr-FR'));
  };

  const getAnimateurName = (id: number) => {
    const animateur = animateurs.find(a => a.id === id);
    return animateur ? `${animateur.prenom} ${animateur.nom}` : 'Inconnu';
  };

  const todayPlanning = getTodayPlanning();
  const tomorrowPlanning = getTomorrowPlanning();
  const todayEvents = getTodayEvents();

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
      title: "Planning",
      description: "Repos animateurs, astreintes, planning personnalisé",
      icon: Calendar,
      route: "/planning",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      id: 5,
      title: "Comptabilité",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/7c90a0bc-b913-4540-a716-4231ebbd4a96.png" 
              alt="Logo Fondation Maison de la Gendarmerie" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion CVJ MG</h1>
              <p className="text-gray-600">Système de gestion de colonie de vacances</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tableau de bord</h2>
          <p className="text-gray-600">Accédez à tous les modules de gestion de votre colonie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card key={module.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${module.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-300">0{module.id}</div>
                  </div>
                  <CardTitle className="text-xl text-gray-900">{module.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={module.route}>
                    <Button className={`w-full ${module.color} text-white transition-colors`}>
                      Accéder au module
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu rapide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Jeunes inscrits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{animateurs.length}</div>
              <div className="text-sm text-gray-600">Animateurs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Jours de séjour</div>
            </div>
          </div>

          {/* Planning et événements du jour */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aujourd'hui */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Aujourd'hui ({new Date().toLocaleDateString('fr-FR')})
              </h4>
              {todayPlanning ? (
                <div className="space-y-2">
                  {todayPlanning.animateurs.map((service, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium">{getAnimateurName(service.id)}</div>
                      <div className="text-gray-600">
                        {service.typeService} • {service.heureDebut}-{service.heureFin}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucun planning défini</div>
              )}
            </div>

            {/* Demain */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                Demain ({new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')})
              </h4>
              {tomorrowPlanning ? (
                <div className="space-y-2">
                  {tomorrowPlanning.animateurs.map((service, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium">{getAnimateurName(service.id)}</div>
                      <div className="text-gray-600">
                        {service.typeService} • {service.heureDebut}-{service.heureFin}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucun planning défini</div>
              )}
            </div>

            {/* Événements du jour */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                Événements du jour
              </h4>
              {todayEvents.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {todayEvents.map((event, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-200">
                      <div className="font-medium text-red-900">{event.youngsterName}</div>
                      <div className="text-red-700">{event.type}</div>
                      <div className="text-red-600 text-xs">{event.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Aucun événement enregistré</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
