
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Heart, Shield, UserCheck, Calculator } from "lucide-react";

const Index = () => {
  const sections = [
    {
      title: "Administratif",
      description: "Gestion administrative de la fondation",
      icon: FileText,
      path: "/administratif",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Comptabilité",
      description: "Suivi comptable et financier",
      icon: Calculator,
      path: "/comptabilite",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Équipe",
      description: "Gestion de l'équipe",
      icon: Users,
      path: "/equipe",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Infirmerie",
      description: "Suivi médical et soins",
      icon: Heart,
      path: "/infirmerie",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Jeunes",
      description: "Gestion des jeunes accueillis",
      icon: UserCheck,
      path: "/jeunes",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Planning",
      description: "Planification des activités",
      icon: Calendar,
      path: "/planning",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <img 
                    src="/lovable-uploads/e396c5b7-f798-4e39-a85a-ca197ed24ddc.png" 
                    alt="Fondation Maison de la Gendarmerie" 
                    className="h-16 w-auto"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Fondation Maison de la Gendarmerie
              </h1>
              <p className="text-lg text-gray-600">
                Système de gestion intégré
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Accédez aux différents modules
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sélectionnez le module que vous souhaitez utiliser pour gérer les différents aspects de la fondation.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.path} to={section.path} className="group">
                <Card className="h-full hover:shadow-xl transition-all duration-200 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:-translate-y-1">
                  <CardHeader className="text-center pb-4">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-200 ${section.bgColor} group-hover:scale-110`}>
                      <IconComponent className={`h-8 w-8 ${section.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-gray-700">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 group-hover:text-gray-500">
                      {section.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200/50">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Shield className="h-5 w-5" />
            <span>Fondation Maison de la Gendarmerie - Système de gestion</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Toutes les données sont stockées localement dans votre navigateur
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
