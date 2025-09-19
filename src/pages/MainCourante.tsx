import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, ArrowLeft, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import EventForm from "@/components/EventForm";
import EventsList from "@/components/EventsList";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useJeunes } from "@/hooks/useJeunes";
import { toast } from "@/components/ui/use-toast";

export interface MainCouranteEvent {
  id: string;
  date: string;
  time: string;
  description: string;
  selectedMembers: string[];
  selectedJeunes: string[];
  createdBy?: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

const MainCourante = () => {
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState<MainCouranteEvent[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'team' | 'jeunes'>('all');
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();
  const { team } = useTeamManagement();
  const { jeunes } = useJeunes();

  const loadEvents = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const loadedEvents = await db.getAll('mainCouranteEvents', currentSession.id);
      setEvents(loadedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  useEffect(() => {
    if (isInitialized && currentSession) {
      loadEvents();
    }
  }, [isInitialized, currentSession]);

  const handleSaveEvent = async (eventData: {
    date: string;
    time: string;
    description: string;
    selectedMembers: string[];
    selectedJeunes: string[];
  }) => {
    if (!isInitialized || !currentSession) return;

    try {
      const newEvent: MainCouranteEvent = {
        id: Date.now().toString(),
        ...eventData,
        sessionId: currentSession.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.save('mainCouranteEvents', newEvent);
      await loadEvents();
      setShowEventForm(false);
      
      toast({
        title: "Événement ajouté",
        description: "L'événement a été enregistré avec succès dans la main courante.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'événement.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!isInitialized) return;

    try {
      await db.delete('mainCouranteEvents', eventId);
      await loadEvents();
      
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé de la main courante.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement.",
        variant: "destructive",
      });
    }
  };

  const filteredEvents = events.filter(event => {
    if (filterType === 'all') return true;
    if (filterType === 'team') return event.selectedMembers.length > 0;
    if (filterType === 'jeunes') return event.selectedJeunes.length > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Main courante</h1>
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestion des événements</span>
                <Button onClick={() => setShowEventForm(true)} className="animate-scale-in">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel événement
                </Button>
              </CardTitle>
              <CardDescription>
                Enregistrez tous les événements importants avec les personnes concernées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrer par :</span>
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={filterType === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('team')}
                >
                  Équipe
                </Button>
                <Button
                  variant={filterType === 'jeunes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('jeunes')}
                >
                  Jeunes
                </Button>
              </div>
              
              <EventsList 
                events={filteredEvents}
                team={team}
                jeunes={jeunes}
                onDeleteEvent={handleDeleteEvent}
              />
            </CardContent>
          </Card>
        </div>

        {showEventForm && (
          <EventForm
            isOpen={showEventForm}
            onClose={() => setShowEventForm(false)}
            onSave={handleSaveEvent}
            team={team}
            jeunes={jeunes}
          />
        )}
      </main>
    </div>
  );
};

export default MainCourante;