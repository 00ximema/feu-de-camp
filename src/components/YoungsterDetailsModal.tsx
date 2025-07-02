
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Youngster } from "@/types/youngster";
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  AlertTriangle,
  Pill,
  FileText,
  Utensils
} from "lucide-react";

interface YoungsterDetailsModalProps {
  youngster: Youngster | null;
  isOpen: boolean;
  onClose: () => void;
}

const YoungsterDetailsModal: React.FC<YoungsterDetailsModalProps> = ({
  youngster,
  isOpen,
  onClose
}) => {
  if (!youngster) return null;

  // Extraire les informations téléphoniques des remarques
  const extractPhoneInfo = (remarques: string) => {
    if (!remarques) return null;
    
    const phoneInfoMatch = remarques.match(/Informations générales - (.+?)(?:\||$)/);
    if (phoneInfoMatch) {
      return phoneInfoMatch[1].trim();
    }
    return null;
  };

  // Nettoyer les remarques en retirant les informations téléphoniques
  const cleanRemarks = (remarques: string) => {
    if (!remarques) return '';
    
    return remarques.replace(/\s*\|\s*Informations générales - .+?(?=\||$)/, '').trim();
  };

  const phoneInfo = extractPhoneInfo(youngster.remarques || '');
  const cleanedRemarks = cleanRemarks(youngster.remarques || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {youngster.prenom} {youngster.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div>
            <h3 className="font-semibold mb-3">Informations générales</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{youngster.age} ans</span>
              </div>
              
              {youngster.dateNaissance && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Né(e) le {youngster.dateNaissance}</span>
                </div>
              )}
              
              {youngster.ville && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{youngster.ville}</span>
                </div>
              )}
              
              {/* Téléphone principal */}
              {youngster.telephone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Principal: {youngster.telephone}</span>
                </div>
              )}

              {/* Tous les numéros de téléphone */}
              {phoneInfo && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium mb-1">Tous les numéros :</div>
                    <div className="text-muted-foreground">{phoneInfo}</div>
                  </div>
                </div>
              )}
              
              {youngster.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{youngster.email}</span>
                </div>
              )}
            </div>
          </div>

          {youngster.adresse && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Adresse</h3>
                <p className="text-sm text-muted-foreground">{youngster.adresse}</p>
              </div>
            </>
          )}

          {youngster.contactUrgence && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Contact d'urgence</h3>
                <p className="text-sm text-muted-foreground">{youngster.contactUrgence}</p>
              </div>
            </>
          )}

          {/* Allergies */}
          {youngster.allergies && youngster.allergies.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Allergies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {youngster.allergies.map((allergie, index) => (
                    <Badge key={index} variant="destructive">
                      {allergie}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Médicaments */}
          {youngster.medicaments && youngster.medicaments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Médicaments
                </h3>
                <div className="flex flex-wrap gap-2">
                  {youngster.medicaments.map((medicament, index) => (
                    <Badge key={index} variant="outline">
                      {medicament}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Régime alimentaire */}
          {youngster.regime && youngster.regime.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-green-500" />
                  Régime alimentaire
                </h3>
                <div className="flex flex-wrap gap-2">
                  {youngster.regime.map((regimeItem, index) => (
                    <Badge key={index} variant="secondary">
                      {regimeItem}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Remarques - seulement si il y a des remarques après nettoyage */}
          {cleanedRemarks && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Remarques
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {cleanedRemarks}
                </p>
              </div>
            </>
          )}

          {youngster.dateInscription && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Date d'inscription</h3>
                <p className="text-sm text-muted-foreground">{youngster.dateInscription}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YoungsterDetailsModal;
