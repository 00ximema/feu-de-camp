
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Heart, Calculator, UserCheck } from "lucide-react";

const Index = () => {
  const sections = [
    {
      title: "Gestion des jeunes",
      description: "Import CSV, événements médicaux, suivi individualisé",
      icon: UserCheck,
      path: "/jeunes",
      color: "text-white",
      bgColor: "bg-blue-500",
      number: "01"
    },
    {
      title: "Gestion de l'équipe",
      description: "Fiches animateurs, intégration des contrats et autres documents",
      icon: Users,
      path: "/equipe",
      color: "text-white",
      bgColor: "bg-green-500",
      number: "02"
    },
    {
      title: "Gestion administrative",
      description: "Projet pédagogique, documents directeurs",
      icon: FileText,
      path: "/administratif",
      color: "text-white",
      bgColor: "bg-purple-500",
      number: "03"
    },
    {
      title: "Planning",
      description: "Repos animateurs, astreintes, planning personnalisé",
      icon: Calendar,
      path: "/planning",
      color: "text-white",
      bgColor: "bg-orange-500",
      number: "04"
    },
    {
      title: "Comptabilité",
      description: "Gestion financière, import Excel, budgets",
      icon: Calculator,
      path: "/comptabilite",
      color: "text-white",
      bgColor: "bg-red-500",
      number: "05"
    },
    {
      title: "Infirmerie",
      description: "Suivi médical, soins et dossiers de santé",
      icon: Heart,
      path: "/infirmerie",
      color: "text-white",
      bgColor: "bg-pink-500",
      number: "06"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <div className="w-8 h-8 grid grid-cols-2 gap-1">
                <div className="bg-blue-600 rounded-sm"></div>
                <div className="bg-blue-400 rounded-sm"></div>
                <div className="bg-blue-400 rounded-sm"></div>
                <div className="bg-blue-600 rounded-sm"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion CVJ MG</h1>
              <p className="text-gray-600">Système de gestion de colonie de vacances</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
          <p className="text-gray-600">Accédez à tous les modules de gestion de votre colonie</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.path} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100">
                  {section.number}
                </div>
                <CardHeader className="pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${section.bgColor}`}>
                    <IconComponent className={`h-8 w-8 ${section.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm leading-relaxed">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to={section.path}>
                    <Button className={`w-full ${section.bgColor} hover:opacity-90 text-white`}>
                      Accéder au module
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Index;
