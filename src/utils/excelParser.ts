
import * as XLSX from 'xlsx';
import { Youngster } from "@/types/youngster";

export const parseExcel = async (file: File): Promise<Youngster[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Prendre la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir en JSON à partir de la ligne 7 (index 6)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          range: 6 // Commencer à la ligne 7 (index 6)
        });
        
        const youngsters: Youngster[] = [];
        
        // Traiter chaque ligne
        for (let i = 1; i < jsonData.length; i++) { // Commencer à 1 pour éviter l'en-tête
          const row = jsonData[i] as any[];
          
          // Arrêter si on trouve "Nombre de filles :"
          if (row[0] && row[0].toString().includes("Nombre de filles")) {
            break;
          }
          
          // Vérifier si la ligne contient des données valides
          if (!row[0] || !row[1]) {
            continue;
          }
          
          // Extraire le nom et prénom
          const nomPrenom = row[0]?.toString().split(' ');
          const nom = nomPrenom[0] || '';
          const prenom = nomPrenom.slice(1).join(' ') || '';
          
          // Extraire l'âge depuis la colonne âge (ex: "17 ans 6 mois 19 jours")
          const ageText = row[2]?.toString() || '';
          const ageMatch = ageText.match(/(\d+)\s*ans?/);
          const age = ageMatch ? parseInt(ageMatch[1]) : 0;
          
          // Extraire le genre
          const genre = row[3]?.toString() || '';
          
          // Extraire le responsable
          const responsable = row[4]?.toString() || '';
          
          // Extraire les téléphones (peut contenir plusieurs numéros)
          const telephones = row[5]?.toString() || '';
          // Extraire le premier numéro de téléphone portable (commence par 06 ou 07)
          const phoneMatch = telephones.match(/0[67][\s\.\-]?(?:\d{2}[\s\.\-]?){4}/);
          const telephone = phoneMatch ? phoneMatch[0].replace(/[\s\.\-]/g, '') : '';
          
          // Extraire l'adresse
          const adresse = row[6]?.toString() || '';
          
          // Extraire les observations
          const observations = row[7]?.toString() || '';
          
          // Extraire le transport
          const transport = row[8]?.toString() || '';
          
          // Extraire l'email
          const email = row[9]?.toString() || '';
          
          // Extraire la ville et code postal de l'adresse
          const adresseMatch = adresse.match(/^(.+?)\s+(\d{5})\s+(.+)$/);
          let ville = '';
          let codePostal = '';
          let adresseRue = adresse;
          
          if (adresseMatch) {
            adresseRue = adresseMatch[1];
            codePostal = adresseMatch[2];
            ville = adresseMatch[3];
          }
          
          const youngster: Youngster = {
            id: Date.now().toString() + i,
            nom,
            prenom,
            age,
            genre: genre === 'M' ? 'M' : 'F',
            responsable,
            transport,
            dateNaissance: row[1]?.toString() || '',
            adresse: adresseRue,
            ville,
            codePostal,
            telephone,
            email,
            remarques: observations
          };
          
          youngsters.push(youngster);
        }
        
        console.log('Jeunes parsés:', youngsters);
        resolve(youngsters);
        
      } catch (error) {
        console.error("Erreur lors du parsing:", error);
        reject(new Error("Erreur lors du parsing du fichier Excel"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"));
    };
    
    reader.readAsBinaryString(file);
  });
};
