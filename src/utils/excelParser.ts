
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
          range: 6,
          raw: false,
          dateNF: 'dd/mm/yyyy'
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
          
          // Colonne 1: Date de Naissance
          let dateNaissance = '';
          if (row[1]) {
            const dateValue = row[1];
            if (typeof dateValue === 'number') {
              const excelEpoch = new Date(1900, 0, 1);
              const excelDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
              dateNaissance = excelDate.toLocaleDateString('fr-FR');
            } else {
              let dateString = dateValue.toString();
              console.log('Date string original:', dateString);
              
              const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
              if (dateMatch) {
                let [, mm, jj, yy] = dateMatch;
                
                if (yy.length === 2) {
                  const currentYear = new Date().getFullYear();
                  const currentCentury = Math.floor(currentYear / 100) * 100;
                  const year2digit = parseInt(yy);
                  yy = year2digit > 50 ? (1900 + year2digit).toString() : (currentCentury + year2digit).toString();
                }
                
                dateNaissance = `${jj.padStart(2, '0')}/${mm.padStart(2, '0')}/${yy}`;
                console.log('Date convertie:', dateNaissance);
              } else {
                dateNaissance = dateString;
              }
            }
          }
          
          // Colonne 2: Âge
          let age = 0;
          if (row[2]) {
            const ageValue = row[2];
            console.log('Valeur âge brute:', ageValue, 'Type:', typeof ageValue);
            
            if (typeof ageValue === 'number') {
              age = Math.floor(ageValue);
            } else if (typeof ageValue === 'string') {
              const ageNum = parseInt(ageValue.toString());
              if (!isNaN(ageNum)) {
                age = ageNum;
              }
            }
          }
          
          console.log('Âge final assigné:', age);
          
          // Colonne 3: M/F
          const genre = row[3]?.toString().trim() || '';
          
          // Colonne 4: Responsable
          const responsable = row[4]?.toString() || '';
          
          // Colonne 5: Téléphones - Extraction et formatage
          let telephone = '';
          let remarquesWithPhones = '';
          
          if (row[5]) {
            const phoneData = row[5].toString();
            console.log('Données téléphone brutes:', phoneData);
            
            // Chercher tous les numéros avec leurs types
            const phoneRegex = /(Perso|Bureau|Portable|Individuel|Port):\s*([0-9]{10}|[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2})/g;
            const phoneMatches = [...phoneData.matchAll(phoneRegex)];
            
            if (phoneMatches.length > 0) {
              const formattedPhones: string[] = [];
              
              phoneMatches.forEach(match => {
                let type = match[1];
                // Convertir "Port" en "Portable"
                if (type === 'Port') type = 'Portable';
                
                let number = match[2].replace(/\./g, ''); // Enlever les points
                
                // Prendre le premier numéro pour le champ principal
                if (!telephone) {
                  telephone = number;
                }
                
                // Formater le numéro avec des espaces : 06 45 78 12 33
                if (number.length === 10) {
                  const formattedNumber = number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
                  formattedPhones.push(`${type}: ${formattedNumber}`);
                }
              });
              
              // Joindre tous les numéros formatés avec des séparateurs propres
              remarquesWithPhones = formattedPhones.join(' | ');
            } else {
              // Fallback : chercher un numéro simple sans type
              const simplePhoneMatch = phoneData.match(/([0-9]{10})/);
              if (simplePhoneMatch) {
                telephone = simplePhoneMatch[1];
                const formattedNumber = telephone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
                remarquesWithPhones = `Téléphone: ${formattedNumber}`;
              }
            }
          }
          
          console.log('Téléphone extrait:', telephone);
          console.log('Remarques téléphone formatées:', remarquesWithPhones);
          
          // Colonne 6: Adresse complète
          let adresse = '';
          let ville = '';
          let codePostal = '';
          
          if (row[6]) {
            const adresseComplete = row[6].toString().trim();
            console.log('Adresse complète brute:', adresseComplete);
            
            // Garder l'adresse complète
            adresse = adresseComplete;
            
            // Essayer d'extraire le code postal et la ville pour les champs séparés
            const codePostalMatch = adresseComplete.match(/\b(\d{5})\b/);
            if (codePostalMatch) {
              codePostal = codePostalMatch[1];
              
              // Extraire la ville (ce qui suit le code postal)
              const codePostalIndex = adresseComplete.indexOf(codePostal);
              if (codePostalIndex !== -1) {
                const afterPostal = adresseComplete.substring(codePostalIndex + 5).trim();
                ville = afterPostal.replace(/^[,\s]+/, ''); // Nettoyer les virgules/espaces en début
              }
            }
          }
          
          console.log('Adresse parsée:', { adresse, codePostal, ville });
          
          // Colonne 7: Observations/Remarques
          let observations = '';
          if (row[7]) {
            observations = row[7].toString();
          }
          
          // Combiner les remarques existantes avec les infos téléphone formatées
          let remarquesFinales = '';
          if (remarquesWithPhones && observations) {
            remarquesFinales = `${remarquesWithPhones} | ${observations}`;
          } else if (remarquesWithPhones) {
            remarquesFinales = remarquesWithPhones;
          } else if (observations) {
            remarquesFinales = observations;
          }
          
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
            remarques: remarquesFinales
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
