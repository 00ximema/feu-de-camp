
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
          
          // Colonne 5: Téléphones - Extraire et formater proprement
          let telephone = '';
          let remarquesWithPhones = '';
          
          if (row[5]) {
            const phoneData = row[5].toString();
            console.log('Données téléphone brutes:', phoneData);
            
            // Chercher tous les numéros avec leurs types et les formater proprement
            const phoneMatches = phoneData.match(/(Perso|Bureau|Portable|Individuel|Port):\s*(0[1-9](?:\d{8}|\d{2}\.\d{2}\.\d{2}\.\d{2}))/g);
            
            if (phoneMatches && phoneMatches.length > 0) {
              const formattedPhones: string[] = [];
              
              phoneMatches.forEach(match => {
                const phoneMatch = match.match(/(Perso|Bureau|Portable|Individuel|Port):\s*(0[1-9](?:\d{8}|\d{2}\.\d{2}\.\d{2}\.\d{2}))/);
                if (phoneMatch) {
                  let type = phoneMatch[1];
                  // Convertir "Port" en "Portable" pour l'affichage
                  if (type === 'Port') type = 'Portable';
                  
                  const number = phoneMatch[2].replace(/\./g, '');
                  
                  // Prendre le premier numéro pour le champ principal
                  if (!telephone) {
                    telephone = number;
                  }
                  
                  // Formater pour l'affichage : Type: 06 45 78 12 33
                  const formattedNumber = number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
                  formattedPhones.push(`${type}: ${formattedNumber}`);
                }
              });
              
              // Joindre tous les numéros formatés
              remarquesWithPhones = formattedPhones.join(' | ');
            } else {
              // Si pas de format spécial, chercher juste un numéro simple
              const simplePhone = phoneData.match(/0[1-9]\d{8}/);
              if (simplePhone) {
                telephone = simplePhone[0];
              } else {
                telephone = phoneData.replace(/\s/g, '');
              }
            }
          }
          
          console.log('Téléphone extrait:', telephone);
          console.log('Remarques téléphone formatées:', remarquesWithPhones);
          
          // Colonne 6: Adresse complète - Extraction améliorée
          let adresse = '';
          let ville = '';
          let codePostal = '';
          
          if (row[6]) {
            const adresseComplete = row[6].toString().trim();
            console.log('Adresse complète brute:', adresseComplete);
            
            // Chercher le code postal (5 chiffres) dans l'adresse
            const codePostalMatch = adresseComplete.match(/\b(\d{5})\b/);
            
            if (codePostalMatch) {
              codePostal = codePostalMatch[1];
              const codePostalIndex = adresseComplete.indexOf(codePostal);
              
              // Tout ce qui est avant le code postal = adresse
              const beforePostal = adresseComplete.substring(0, codePostalIndex).trim();
              adresse = beforePostal.replace(/[,\s]+$/, ''); // Nettoyer les virgules/espaces en fin
              
              // Tout ce qui est après le code postal = ville
              const afterPostal = adresseComplete.substring(codePostalIndex + 5).trim();
              ville = afterPostal.replace(/^[,\s]+/, ''); // Nettoyer les virgules/espaces en début
            } else {
              // Si pas de code postal trouvé, essayer de diviser par la dernière virgule
              const lastCommaIndex = adresseComplete.lastIndexOf(',');
              if (lastCommaIndex > 0) {
                adresse = adresseComplete.substring(0, lastCommaIndex).trim();
                ville = adresseComplete.substring(lastCommaIndex + 1).trim();
              } else {
                // Sinon, tout va dans l'adresse
                adresse = adresseComplete;
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
