
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
          range: 6, // Commencer à la ligne 7 (index 6)
          raw: false, // Importante pour avoir les dates en format texte
          dateNF: 'dd/mm/yyyy' // Format de date français
        });
        
        console.log('Données Excel brutes:', jsonData);
        
        const youngsters: Youngster[] = [];
        
        // Traiter chaque ligne à partir de la ligne 2 (index 1) pour éviter l'en-tête
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          console.log(`Ligne ${i}:`, row);
          
          // Arrêter si on trouve "Nombre de filles :"
          if (row[0] && row[0].toString().includes("Nombre de filles")) {
            console.log('Arrêt détecté à la ligne:', row[0]);
            break;
          }
          
          // Vérifier si la ligne contient des données valides
          if (!row[0] || row[0].toString().trim() === '') {
            console.log('Ligne vide ignorée:', i);
            continue;
          }
          
          // Colonne 0: Nom/Prénom
          const nomPrenom = row[0]?.toString().trim() || '';
          const nomPrenomParts = nomPrenom.split(' ');
          const nom = nomPrenomParts[0] || '';
          const prenom = nomPrenomParts.slice(1).join(' ') || '';
          
          // Colonne 1: Date de Naissance - Corriger MM/JJ vers JJ/MM
          let dateNaissance = '';
          if (row[1]) {
            const dateValue = row[1];
            if (typeof dateValue === 'number') {
              // Convertir le numéro de série Excel en date
              const excelEpoch = new Date(1900, 0, 1);
              const excelDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
              dateNaissance = excelDate.toLocaleDateString('fr-FR');
            } else {
              let dateString = dateValue.toString();
              // Inverser MM/JJ/YYYY vers JJ/MM/YYYY
              const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
              if (dateMatch) {
                const [, mm, jj, yyyy] = dateMatch;
                dateNaissance = `${jj}/${mm}/${yyyy}`;
              } else {
                dateNaissance = dateString;
              }
            }
          }
          
          // Colonne 2: Âge (ex: "17 ans 6 mois 19 jours")
          const ageText = row[2]?.toString() || '';
          const ageMatch = ageText.match(/(\d+)\s*ans?/);
          const age = ageMatch ? parseInt(ageMatch[1]) : 0;
          
          // Colonne 3: M/F
          const genre = row[3]?.toString().trim() || '';
          
          // Colonne 4: Responsable
          const responsable = row[4]?.toString() || '';
          
          // Colonne 5: Téléphones - Récupérer TOUS les numéros
          const telephones = row[5]?.toString() || '';
          console.log('Téléphones bruts:', telephones);
          
          // Extraire TOUS les numéros de téléphone
          const allPhones: string[] = [];
          const phoneRegex = /0[1-9](?:[\s\.\-]?\d{2}){4}/g;
          let phoneMatch;
          
          while ((phoneMatch = phoneRegex.exec(telephones)) !== null) {
            const cleanPhone = phoneMatch[0].replace(/[\s\.\-]/g, '');
            if (!allPhones.includes(cleanPhone)) {
              allPhones.push(cleanPhone);
            }
          }
          
          // Prendre le premier numéro portable (06/07) comme principal, sinon le premier numéro
          let telephone = '';
          const mobilePhone = allPhones.find(phone => phone.startsWith('06') || phone.startsWith('07'));
          if (mobilePhone) {
            telephone = mobilePhone;
          } else if (allPhones.length > 0) {
            telephone = allPhones[0];
          }
          
          console.log('Téléphones extraits:', allPhones);
          console.log('Téléphone principal:', telephone);
          
          // Colonne 6: Adresse complète
          const adresseComplete = row[6]?.toString() || '';
          console.log('Adresse complète:', adresseComplete);
          
          // Parser l'adresse pour extraire rue, code postal et ville
          let adresse = '';
          let ville = '';
          let codePostal = '';
          
          if (adresseComplete) {
            // Séparer par les sauts de ligne si présents
            const adresseLines = adresseComplete.split('\n');
            if (adresseLines.length >= 2) {
              adresse = adresseLines[0].trim();
              const secondLine = adresseLines[1].trim();
              
              // Chercher le code postal (5 chiffres) dans la deuxième ligne
              const codePostalMatch = secondLine.match(/(\d{5})/);
              if (codePostalMatch) {
                codePostal = codePostalMatch[1];
                ville = secondLine.replace(codePostal, '').trim();
              } else {
                ville = secondLine;
              }
            } else {
              // Si une seule ligne, chercher le code postal
              const codePostalMatch = adresseComplete.match(/(\d{5})/);
              if (codePostalMatch) {
                codePostal = codePostalMatch[1];
                const parts = adresseComplete.split(codePostal);
                adresse = parts[0]?.trim() || '';
                ville = parts[1]?.trim() || '';
              } else {
                adresse = adresseComplete;
              }
            }
          }
          
          console.log('Adresse parsée:', { adresse, codePostal, ville });
          
          // Colonne 7: Observations
          const observations = row[7]?.toString() || '';
          
          // Colonne 8: Transport
          const transport = row[8]?.toString() || '';
          
          // Colonne 9: Email
          const email = row[9]?.toString() || '';
          
          const youngster: Youngster = {
            id: Date.now().toString() + i,
            nom,
            prenom,
            age,
            genre: genre === 'M' ? 'M' : 'F',
            responsable,
            transport,
            dateNaissance,
            adresse,
            ville,
            codePostal,
            telephone,
            email,
            remarques: observations,
            // Ajouter tous les numéros de téléphone dans les remarques pour référence
            ...(allPhones.length > 1 && {
              remarques: `${observations}${observations ? ' | ' : ''}Téléphones: ${allPhones.join(', ')}`
            })
          };
          
          console.log('Jeune créé:', youngster);
          youngsters.push(youngster);
        }
        
        console.log('Total jeunes parsés:', youngsters.length);
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
