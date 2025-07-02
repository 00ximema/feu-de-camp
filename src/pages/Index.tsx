
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Heart, Shield, UserCheck } from "lucide-react";

const Index = () => {
  const sections = [
    {
      title: "Administratif",
      description: "Gestion administrative de la fondation",
      icon: FileText,
      path: "/administratif",
      color: "text-blue-600",
    },
    {
      title: "Comptabilité",
      description: "Suivi comptable et financier",
      icon: FileText,
      path: "/comptabilite",
      color: "text-green-600",
    },
    {
      title: "Équipe",
      description: "Gestion de l'équipe",
      icon: Users,
      path: "/equipe",
      color: "text-purple-600",
    },
    {
      title: "Infirmerie",
      description: "Suivi médical et soins",
      icon: Heart,
      path: "/infirmerie",
      color: "text-red-600",
    },
    {
      title: "Jeunes",
      description: "Gestion des jeunes accueillis",
      icon: UserCheck,
      path: "/jeunes",
      color: "text-orange-600",
    },
    {
      title: "Planning",
      description: "Planification des activités",
      icon: Calendar,
      path: "/planning",
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <img 
                src="/lovable-uploads/e396c5b7-f798-4e39-a85a-ca197ed24ddc.png" 
                alt="Fondation Maison de la Gendarmerie" 
                className="h-20 w-auto mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-gray-900">
                Fondation Maison de la Gendarmerie
              </h1>
              <p className="text-lg text-gray-600 mt-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.path} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                <Link to={section.path} className="block h-full">
                  <CardHeader className="text-center pb-4">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 group-hover:bg-gray-200 transition-colors ${section.color}`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600">
                      {section.description}
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Shield className="h-5 w-5" />
            <span>Fondation Maison de la Gendarmerie - Système de gestion</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
