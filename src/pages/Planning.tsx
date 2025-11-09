
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Table, UserCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PlanningTableGenerator from "@/components/PlanningTableGenerator";
import LeaveSignaturePlanning from "@/components/LeaveSignaturePlanning";
import ErrorBoundary from "@/components/ErrorBoundary";

const Planning = () => {
  console.log('Planning component rendering');
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Planning</h1>
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
        <Tabs defaultValue="planning" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="planning" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>Planning Tableau</span>
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Repos des personnels</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="planning">
            <ErrorBoundary>
              <PlanningTableGenerator />
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="leaves">
            <ErrorBoundary>
              <LeaveSignaturePlanning />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Planning;
