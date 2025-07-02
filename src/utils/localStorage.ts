
// Utilitaire pour gérer le stockage local de manière sécurisée
export const LocalStorageKeys = {
  YOUNGSTERS: 'imported-youngsters',
  MEDICAL_FILES: 'fiches-medicales',
  TEAM_MEMBERS: 'equipe-animateurs',
  PLANNING_DATA: 'planning-data',
  ADMIN_CHECKLIST: 'admin-checklist',
} as const;

export class LocalStorageManager {
  static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans localStorage (${key}):`, error);
    }
  }

  static load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erreur lors du chargement depuis localStorage (${key}):`, error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression dans localStorage (${key}):`, error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erreur lors de la suppression complète du localStorage:', error);
    }
  }

  // Méthodes spécifiques pour chaque type de données
  static saveYoungsters(youngsters: any[]): void {
    this.save(LocalStorageKeys.YOUNGSTERS, youngsters);
  }

  static loadYoungsters(): any[] {
    return this.load(LocalStorageKeys.YOUNGSTERS) || [];
  }

  static saveMedicalFiles(files: any[]): void {
    this.save(LocalStorageKeys.MEDICAL_FILES, files);
  }

  static loadMedicalFiles(): any[] {
    return this.load(LocalStorageKeys.MEDICAL_FILES) || [];
  }

  static saveTeamMembers(members: any[]): void {
    this.save(LocalStorageKeys.TEAM_MEMBERS, members);
  }

  static loadTeamMembers(): any[] {
    return this.load(LocalStorageKeys.TEAM_MEMBERS) || [];
  }
}
