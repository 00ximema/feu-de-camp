

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
          
          // Colonne 2: Âge - Extraction directe
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
          
          // Colonne 5: Téléphones - Format simple (un seul numéro)
          const telephone = row[5]?.toString().replace(/\s/g, '') || '';
          console.log('Téléphone extrait:', telephone);
          
          // Colonne 6: Adresse complète - Parser correctement
          const adresseComplete = row[6]?.toString() || '';
          console.log('Adresse complète:', adresseComplete);
          
          let adresse = '';
          let ville = '';
          let codePostal = '';
          
          if (adresseComplete) {
            // Chercher le code postal (5 chiffres) dans l'adresse
            const codePostalMatch = adresseComplete.match(/(\d{5})/);
            if (codePostalMatch) {
              codePostal = codePostalMatch[1];
              // Diviser l'adresse au niveau du code postal
              const parts = adresseComplete.split(codePostal);
              adresse = parts[0]?.trim().replace(/,$/, '') || ''; // Retirer la virgule finale si présente
              ville = parts[1]?.trim() || '';
            } else {
              // Si pas de code postal trouvé, prendre toute l'adresse
              adresse = adresseComplete;
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
            remarques: observations
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

