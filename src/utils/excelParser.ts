
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
          
          // Colonne 1: Date de Naissance - Conversion correcte MM/JJ/YYYY vers JJ/MM
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
              console.log('Date string original:', dateString);
              
              // Gérer le format MM/JJ/YY ou MM/JJ/YYYY
              const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
              if (dateMatch) {
                let [, mm, jj, yy] = dateMatch;
                
                // Convertir l'année sur 2 chiffres en 4 chiffres si nécessaire
                if (yy.length === 2) {
                  const currentYear = new Date().getFullYear();
                  const currentCentury = Math.floor(currentYear / 100) * 100;
                  const year2digit = parseInt(yy);
                  // Si l'année à 2 chiffres est > 50, c'est probablement 19xx, sinon 20xx
                  yy = year2digit > 50 ? (1900 + year2digit).toString() : (currentCentury + year2digit).toString();
                }
                
                // Inverser MM/JJ vers JJ/MM
                dateNaissance = `${jj.padStart(2, '0')}/${mm.padStart(2, '0')}/${yy}`;
                console.log('Date convertie:', dateNaissance);
              } else {
                dateNaissance = dateString;
              }
            }
          }
          
          // Colonne 2: Âge - Extraction améliorée
          let age = 0;
          if (row[2]) {
            const ageValue = row[2];
            console.log('Valeur âge brute:', ageValue, 'Type:', typeof ageValue);
            
            if (typeof ageValue === 'number') {
              // Si c'est déjà un nombre, l'utiliser directement
              age = Math.floor(ageValue);
            } else {
              // Si c'est du texte, extraire le nombre
              const ageText = ageValue.toString();
              console.log('Texte âge:', ageText);
              
              // Chercher un nombre au début de la chaîne ou après "ans"
              const ageMatch = ageText.match(/(\d+)/);
              if (ageMatch) {
                age = parseInt(ageMatch[1]);
                console.log('Âge extrait:', age);
              }
            }
          }
          
          console.log('Âge final assigné:', age);
          
          // Colonne 3: M/F
          const genre = row[3]?.toString().trim() || '';
          
          // Colonne 4: Responsable
          const responsable = row[4]?.toString() || '';
          
          // Colonne 5: Téléphones - Récupérer TOUS les numéros avec leur type
          const telephones = row[5]?.toString() || '';
          console.log('Téléphones bruts:', telephones);
          
          // Extraire les numéros avec leur type spécifique
          const phoneTypes = {
            perso: '',
            bureau: '',
            portable: '',
            individuel: ''
          };
          
          // Parser les différents types de numéros
          const lines = telephones.split('\n');
          for (const line of lines) {
            const cleanLine = line.trim();
            
            // Perso.
            if (cleanLine.toLowerCase().includes('perso')) {
              const phoneMatch = cleanLine.match(/0[1-9](?:[\s\.\-]?\d{2}){4}/);
              if (phoneMatch) {
                phoneTypes.perso = phoneMatch[0].replace(/[\s\.\-]/g, '');
              }
            }
            
            // Bur (Bureau)
            else if (cleanLine.toLowerCase().includes('bur')) {
              const phoneMatch = cleanLine.match(/0[1-9](?:[\s\.\-]?\d{2}){4}/);
              if (phoneMatch) {
                phoneTypes.bureau = phoneMatch[0].replace(/[\s\.\-]/g, '');
              }
            }
            
            // Port. (Portable)
            else if (cleanLine.toLowerCase().includes('port')) {
              const phoneMatch = cleanLine.match(/0[1-9](?:[\s\.\-]?\d{2}){4}/);
              if (phoneMatch) {
                phoneTypes.portable = phoneMatch[0].replace(/[\s\.\-]/g, '');
              }
            }
            
            // Ind. (Individuel)
            else if (cleanLine.toLowerCase().includes('ind')) {
              const phoneMatch = cleanLine.match(/0[1-9](?:[\s\.\-]?\d{2}){4}/);
              if (phoneMatch) {
                phoneTypes.individuel = phoneMatch[0].replace(/[\s\.\-]/g, '');
              }
            }
          }
          
          // Téléphone principal = portable en priorité, sinon le premier trouvé
          let telephone = phoneTypes.portable || phoneTypes.perso || phoneTypes.bureau || phoneTypes.individuel;
          
          console.log('Numéros extraits par type:', phoneTypes);
          console.log('Téléphone principal:', telephone);
          
          // Construire la liste complète des informations téléphoniques pour les informations générales
          const phoneInfoArray: string[] = [];
          if (phoneTypes.perso) phoneInfoArray.push(`Perso: ${phoneTypes.perso}`);
          if (phoneTypes.bureau) phoneInfoArray.push(`Bureau: ${phoneTypes.bureau}`);
          if (phoneTypes.portable) phoneInfoArray.push(`Portable: ${phoneTypes.portable}`);
          if (phoneTypes.individuel) phoneInfoArray.push(`Individuel: ${phoneTypes.individuel}`);
          
          const phoneInfo = phoneInfoArray.join(' | ');
          
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
          
          // Construire les remarques avec toutes les informations téléphoniques
          let remarques = observations;
          if (phoneInfo) {
            remarques = `${observations}${observations ? ' | ' : ''}Informations générales - ${phoneInfo}`;
          }
          
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
            remarques
          };
          
          console.log('Jeune créé avec âge:', youngster.age);
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
