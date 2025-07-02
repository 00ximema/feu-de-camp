
import { Youngster } from "@/types/youngster";

export const parseExcel = async (file: File): Promise<Youngster[]> => {
  // Simuler le parsing Excel pour l'instant
  // Dans une vraie implémentation, on utiliserait une librairie comme SheetJS
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        // Ici on simule des données pour éviter l'erreur
        // Dans la vraie vie, on parserait le fichier Excel
        const mockData: Youngster[] = [
          {
            id: "1",
            nom: "Dupont",
            prenom: "Marie",
            age: 12,
            dateNaissance: "2012-05-15",
            adresse: "123 rue de la Paix",
            ville: "Paris",
            codePostal: "75001",
            telephone: "0123456789",
            email: "marie.dupont@email.com"
          }
        ];
        resolve(mockData);
      } catch (error) {
        reject(new Error("Erreur lors du parsing du fichier Excel"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
