
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Youngster } from "@/types/youngster";
import { User, Calendar, MapPin } from "lucide-react";

interface YoungsterCardProps {
  youngster: Youngster;
  onClick?: () => void;
}

const YoungsterCard: React.FC<YoungsterCardProps> = ({ 
  youngster, 
  onClick 
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          {youngster.prenom} {youngster.nom}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{youngster.age} ans</span>
          </div>
          
          {youngster.ville && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{youngster.ville}</span>
            </div>
          )}

          {youngster.allergies && youngster.allergies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {youngster.allergies.map((allergie, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {allergie}
                </Badge>
              ))}
            </div>
          )}

          {youngster.regime && youngster.regime.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {youngster.regime.map((regimeItem, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {regimeItem}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default YoungsterCard;
