
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
  etablissementScolaire?: string;
  niveauScolaire?: string;
  nomParent1?: string;
  telephoneParent1?: string;
  nomParent2?: string;
  telephoneParent2?: string;
  allergies?: string[];
  medicaments?: string[];
  regime?: string[];
  problemesSante?: string[];
  contactUrgence?: string;
  remarques?: string;
  dateInscription?: string;
}
