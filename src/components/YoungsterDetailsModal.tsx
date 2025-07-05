
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Utensils,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";

interface YoungsterDetailsModalProps {
  youngster?: Youngster | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Youngster>) => Promise<Youngster>;
  onDelete?: (id: string) => Promise<void>;
  onAdd?: (jeune: Omit<Youngster, "id">) => Promise<Youngster>;
}

const YoungsterDetailsModal: React.FC<YoungsterDetailsModalProps> = ({
  youngster,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAdd
}) => {
  const [isEditing, setIsEditing] = useState(!youngster); // En mode édition si pas de youngster (ajout)
  const [formData, setFormData] = useState<Partial<Youngster>>(
    youngster ? { ...youngster } : {
      nom: '',
      prenom: '',
      age: 0,
      ville: '',
      telephone: '',
      email: '',
      adresse: '',
      contactUrgence: '',
      notes: '',
      allergies: [],
      medicaments: [],
      regime: []
    }
  );

  // Réinitialiser le formulaire quand le youngster change
  React.useEffect(() => {
    if (youngster) {
      setFormData({ ...youngster });
      setIsEditing(false);
    } else {
      setFormData({
        nom: '',
        prenom: '',
        age: 0,
        ville: '',
        telephone: '',
        email: '',
        adresse: '',
        contactUrgence: '',
        notes: '',
        allergies: [],
        medicaments: [],
        regime: []
      });
      setIsEditing(true);
    }
  }, [youngster]);

  const handleSave = async () => {
    if (!youngster && onAdd) {
      // Mode ajout
      await onAdd(formData as Omit<Youngster, "id">);
    } else if (youngster && onUpdate) {
      // Mode modification
      await onUpdate(youngster.id, formData);
    }
    setIsEditing(false);
    onClose();
  };

  const handleDelete = async () => {
    if (youngster && onDelete && confirm('Êtes-vous sûr de vouloir supprimer ce jeune ?')) {
      await onDelete(youngster.id);
      onClose();
    }
  };

  const handleInputChange = (field: keyof Youngster, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (dateNaissance: string) => {
    if (!dateNaissance) return null;
    
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Déterminer l'âge à afficher
  const displayAge = youngster 
    ? (youngster.age && youngster.age > 0 
        ? youngster.age 
        : calculateAge(youngster.dateNaissance || ''))
    : null;

  // Extraire TOUS les numéros de téléphone des remarques
  const extractAllPhoneNumbers = (remarques: string) => {
    if (!remarques) return [];
    
    const phoneNumbers: string[] = [];
    
    // Pattern pour capturer "Téléphone: XX XX XX XX XX"
    const simplePhoneMatches = remarques.match(/Téléphone:\s*(\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2})/g);
    if (simplePhoneMatches) {
      simplePhoneMatches.forEach(match => {
        phoneNumbers.push(match);
      });
    }
    
    // Pattern pour capturer "Type: XX XX XX XX XX"
    const typedPhoneMatches = remarques.match(/(Perso|Bureau|Portable|Individuel):\s*(\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2})/g);
    if (typedPhoneMatches) {
      typedPhoneMatches.forEach(match => {
        phoneNumbers.push(match);
      });
    }
    
    return phoneNumbers;
  };

  // Nettoyer les remarques en retirant les informations téléphoniques
  const cleanRemarks = (remarques: string) => {
    if (!remarques) return '';
    
    return remarques
      .replace(/Informations générales - /g, '')
      .replace(/\|/g, '')
      .replace(/Téléphone:\s*\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2}/g, '')
      .replace(/(Perso|Bureau|Portable|Individuel):\s*\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const allPhoneNumbers = youngster ? extractAllPhoneNumbers(youngster.remarques || '') : [];
  const cleanedRemarks = youngster ? cleanRemarks(youngster.remarques || '') : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? (youngster ? 'Modifier' : 'Ajouter') : `${youngster?.prenom} ${youngster?.nom}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            // Mode édition/ajout
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom || ''}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom || ''}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville || ''}
                    onChange={(e) => handleInputChange('ville', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone || ''}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Textarea
                  id="adresse"
                  value={formData.adresse || ''}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contactUrgence">Contact d'urgence</Label>
                <Input
                  id="contactUrgence"
                  value={formData.contactUrgence || ''}
                  onChange={(e) => handleInputChange('contactUrgence', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
          ) : (
            // Mode affichage
            <>
              {/* Informations générales */}
              <div>
                <h3 className="font-semibold mb-3">Informations générales</h3>
                <div className="grid grid-cols-1 gap-4">
                  {displayAge && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{displayAge} ans</span>
                    </div>
                  )}
                  
                  {youngster?.dateNaissance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Né(e) le {youngster.dateNaissance}</span>
                    </div>
                  )}
                  
                  {youngster?.ville && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{youngster.ville}</span>
                    </div>
                  )}
                  
                  {/* TOUS les numéros de téléphone extraits des remarques */}
                  {allPhoneNumbers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm space-y-1">
                        {allPhoneNumbers.map((phone, index) => (
                          <div key={index} className="text-muted-foreground">
                            {phone}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Si pas de numéros dans les remarques, afficher le téléphone principal */}
                  {allPhoneNumbers.length === 0 && youngster?.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{youngster.telephone}</span>
                    </div>
                  )}
                  
                  {youngster?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{youngster.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {youngster?.adresse && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Adresse</h3>
                    <p className="text-sm text-muted-foreground">{youngster.adresse}</p>
                  </div>
                </>
              )}

              {youngster?.contactUrgence && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Contact d'urgence</h3>
                    <p className="text-sm text-muted-foreground">{youngster.contactUrgence}</p>
                  </div>
                </>
              )}

              {/* Allergies */}
              {youngster?.allergies && youngster.allergies.length > 0 && (
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
              {youngster?.medicaments && youngster.medicaments.length > 0 && (
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
              {youngster?.regime && youngster.regime.length > 0 && (
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

              {/* Notes */}
              {youngster?.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Notes
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {youngster.notes}
                    </p>
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

              {youngster?.dateInscription && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Date d'inscription</h3>
                    <p className="text-sm text-muted-foreground">{youngster.dateInscription}</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {youngster && !isEditing && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => youngster ? setIsEditing(false) : onClose()}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                {youngster && onUpdate && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Fermer
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YoungsterDetailsModal;
