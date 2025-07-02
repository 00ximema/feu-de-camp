
export interface Youngster {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  dateNaissance?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  contactUrgence?: string;
  allergies?: string[];
  medicaments?: string[];
  remarques?: string;
  regime?: string[];
  dateInscription?: string;
}
