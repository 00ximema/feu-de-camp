
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Heart, Shield, UserCheck, Calculator, ArrowRight, Star } from "lucide-react";

const Index = () => {
  const sections = [
    {
      title: "Administratif",
      description: "Gestion administrative et documents officiels de la fondation",
      icon: FileText,
      path: "/administratif",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Comptabilité",
      description: "Suivi comptable, budgets et gestion financière",
      icon: Calculator,
      path: "/comptabilite",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Équipe",
      description: "Gestion du personnel et des ressources humaines",
      icon: Users,
      path: "/equipe",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      title: "Infirmerie",
      description: "Suivi médical, soins et dossiers de santé",
      icon: Heart,
      path: "/infirmerie",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: "Jeunes",
      description: "Gestion des jeunes accueillis et leurs dossiers",
      icon: UserCheck,
      path: "/jeunes",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Planning",
      description: "Planification des activités et événements",
      icon: Calendar,
      path: "/planning",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
  ];

  const features = [
    "Stockage local sécurisé",
    "Interface intuitive",
    "Gestion complète",
    "Accès rapide aux données"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-gray-100">
                  <img 
                    src="/lovable-uploads/e396c5b7-f798-4e39-a85a-ca197ed24ddc.png" 
                    alt="Fondation Maison de la Gendarmerie" 
                    className="h-20 w-auto"
                  />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Fondation Maison de la Gendarmerie
              </h1>
              <p className="text-xl text-gray-600 font-medium">
                Système de gestion intégré
              </p>
              <div className="flex justify-center items-center mt-4 space-x-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Accédez aux différents modules de gestion
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Notre système intégré vous permet de gérer efficacement tous les aspects de la fondation. 
            Sélectionnez le module que vous souhaitez utiliser pour commencer.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.path} to={section.path} className="group">
                <Card className={`h-full hover:shadow-2xl transition-all duration-300 border-2 ${section.borderColor} bg-white/80 backdrop-blur-sm hover:bg-white hover:-translate-y-2 hover:scale-105`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 transition-all duration-300 ${section.bgColor} group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                      <IconComponent className={`h-10 w-10 ${section.color}`} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 mb-2">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 group-hover:text-gray-500 text-base leading-relaxed mb-4">
                      {section.description}
                    </CardDescription>
                    <div className="flex items-center justify-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
                      <span>Accéder au module</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-20">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">6</div>
                <div className="text-gray-600 font-medium">Modules</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-gray-600 font-medium">Sécurisé</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">Local</div>
                <div className="text-gray-600 font-medium">Stockage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600 font-medium">Disponible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 text-gray-700 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Fondation Maison de la Gendarmerie</span>
            </div>
            <p className="text-gray-600 mb-4">
              Système de gestion intégré - Toutes les données sont stockées localement dans votre navigateur
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <span>• Sécurisé & Privé</span>
              <span>• Interface Moderne</span>
              <span>• Facile d'utilisation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
