import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useJeunes } from "@/hooks/useJeunes";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MainCouranteEvent {
  id: string;
  date: string;
  time: string;
  description: string;
  selectedMembers: string[];
  selectedJeunes: string[];
  createdAt: string;
}

const MainCourantePreview = () => {
  const [latestEvent, setLatestEvent] = useState<MainCouranteEvent | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();
  const { team } = useTeamManagement();
  const { jeunes } = useJeunes();

  useEffect(() => {
    const loadLatestEvent = async () => {
      if (!isInitialized || !currentSession) return;

      try {
        const events = await db.getAll('mainCouranteEvents', currentSession.id);
        const sortedEvents = events.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setTotalEvents(sortedEvents.length);
        if (sortedEvents.length > 0) {
          setLatestEvent(sortedEvents[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
      }
    };

    loadLatestEvent();
  }, [isInitialized, currentSession, db]);

  const getMemberNames = (memberIds: string[]) => {
    return memberIds
      .map(id => {
        const member = team.find(m => m.id === id);
        return member ? `${member.prenom} ${member.nom}` : null;
      })
      .filter(Boolean);
  };

  const getJeuneNames = (jeuneIds: string[]) => {
    return jeuneIds
      .map(id => {
        const jeune = jeunes.find(j => j.id === id);
        return jeune ? `${jeune.prenom} ${jeune.nom}` : null;
      })
      .filter(Boolean);
  };

  if (!latestEvent && totalEvents === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Main courante</CardTitle>
            </div>
            <Link to="/main-courante">
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            Aucun événement enregistré
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Commencez à enregistrer les événements importants de votre séjour.
          </p>
          <Link to="/main-courante">
            <Button className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              Accéder à la main courante
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!latestEvent) return null;

  const allPersons = [
    ...getMemberNames(latestEvent.selectedMembers),
    ...getJeuneNames(latestEvent.selectedJeunes)
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Main courante</CardTitle>
          </div>
          <Link to="/main-courante">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription>
          {totalEvents} événement{totalEvents > 1 ? 's' : ''} enregistré{totalEvents > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(latestEvent.date + 'T' + latestEvent.time), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </span>
          </div>
          
          <p className="text-sm font-medium line-clamp-2">
            {latestEvent.description}
          </p>
          
          {allPersons.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="line-clamp-1">
                {allPersons.slice(0, 2).join(', ')}
                {allPersons.length > 2 && ` +${allPersons.length - 2} autre${allPersons.length > 3 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>
        
        <Link to="/main-courante">
          <Button variant="outline" className="w-full mt-4">
            Voir tous les événements
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default MainCourantePreview;