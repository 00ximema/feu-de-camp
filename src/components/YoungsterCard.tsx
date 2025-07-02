
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Youngster } from "@/types/youngster";
import { User, Calendar, MapPin, Edit, Trash2 } from "lucide-react";

interface YoungsterCardProps {
  youngster: Youngster;
  onClick?: () => void;
  onEdit?: (youngster: Youngster) => void;
  onDelete?: (id: string) => void;
}

const YoungsterCard: React.FC<YoungsterCardProps> = ({ 
  youngster, 
  onClick,
  onEdit,
  onDelete
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

          {(onEdit || onDelete) && (
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(youngster);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(youngster.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default YoungsterCard;
