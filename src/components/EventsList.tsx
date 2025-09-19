import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Clock, Users, User } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MainCouranteEvent } from '@/pages/MainCourante';

interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

interface Jeune {
  id: string;
  nom: string;
  prenom: string;
  age: number;
}

interface EventsListProps {
  events: MainCouranteEvent[];
  team: TeamMember[];
  jeunes: Jeune[];
  onDeleteEvent: (eventId: string) => void;
}

const EventsList: React.FC<EventsListProps> = ({
  events,
  team,
  jeunes,
  onDeleteEvent
}) => {
  const getTeamMemberById = (id: string) => team.find(member => member.id === id);
  const getJeuneById = (id: string) => jeunes.find(jeune => jeune.id === id);

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Aucun événement enregistré</h3>
        <p className="text-muted-foreground">
          Commencez par ajouter votre premier événement à la main courante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-medium transition-shadow animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>
                  {format(new Date(event.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                </span>
                <Badge variant="outline" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.time}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteEvent(event.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description :</h4>
              <p className="text-foreground bg-muted p-3 rounded-md">
                {event.description}
              </p>
            </div>

            {(event.selectedMembers.length > 0 || event.selectedJeunes.length > 0) && (
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Personnes concernées :
                </h4>
                <div className="space-y-2">
                  {event.selectedMembers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-primary mb-1">Équipe :</p>
                      <div className="flex flex-wrap gap-2">
                        {event.selectedMembers.map((memberId) => {
                          const member = getTeamMemberById(memberId);
                          return member ? (
                            <Badge key={memberId} variant="secondary">
                              <User className="h-3 w-3 mr-1" />
                              {member.prenom} {member.nom}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {event.selectedJeunes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-primary mb-1">Jeunes :</p>
                      <div className="flex flex-wrap gap-2">
                        {event.selectedJeunes.map((jeuneId) => {
                          const jeune = getJeuneById(jeuneId);
                          return jeune ? (
                            <Badge key={jeuneId} variant="outline">
                              <User className="h-3 w-3 mr-1" />
                              {jeune.prenom} {jeune.nom}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Créé le {format(parseISO(event.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EventsList;