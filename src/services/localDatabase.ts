interface DatabaseSchema {
  // Sessions
  sessions: {
    id: string;
    name: string;
    createdAt: string;
  };
  
  // Animateurs
  animateurs: {
    id: number;
    sessionId?: string;
    nom: string;
    prenom: string;
    age: number;
    telephone: string;
    email: string;
    role: string;
    formations: string[];
    documents: {
      id: number;
      nom: string;
      type: string;
      dateUpload: string;
      url: string;
    }[];
    notes: string;
  };
  
  // Jeunes - Updated to match Youngster interface
  jeunes: {
    id: string;
    sessionId?: string;
    nom: string;
    prenom: string;
    age: number;
    genre?: string;
    responsable?: string;
    transport?: string;
    dateNaissance?: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
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
    notes?: string;
    dateInscription?: string;
  };

  // Groupes de jeunes
  groupes: {
    id: string;
    sessionId?: string;
    nom: string;
    description?: string;
    couleur: string;
    jeunesIds: string[];
    createdAt: string;
  };
  
  // Événements
  events: {
    id: string;
    sessionId?: string;
    youngesterId: string;
    youngsterName: string;
    type: string;
    description: string;
    date: string;
    timestamp: string;
  };

  // Pièces comptables
  piecesComptables: {
    id: number;
    sessionId?: string;
    date: string;
    libelle: string;
    montant: number;
    categorie: string;
    type: 'recette' | 'depense';
    pieceIntegree: boolean;
    createdAt: string;
    updatedAt: string;
  };
  
  // Plannings - Updated to include more comprehensive planning data
  plannings: {
    id: string;
    sessionId?: string;
    data: Array<Array<{
      date: string;
      timeSlot: string;
      events?: Array<{
        id: string;
        name: string;
        type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
        assignedMembers?: Array<{
          id: string;
          nom: string;
          prenom: string;
          role: string;
        }>;
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
        selectedGroups?: string[];
        selectedJeunes?: string[];
        description?: string;
        notes?: string;
      }>;
    }>>;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
  };

  // Room data - New dedicated table for room configurations and assignments
  roomData: {
    id: string;
    sessionId?: string;
    configs: Array<{
      capacity: number;
      count: number;
      gender: 'male' | 'female';
    }>;
    rooms: Array<{
      id: string;
      name: string;
      capacity: number;
      occupants: Array<{
        id: string;
        nom: string;
        prenom: string;
        age: number;
        genre?: string;
        responsable?: string;
        transport?: string;
        dateNaissance?: string;
        adresse?: string;
        ville?: string;
        codePostal?: string;
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
        notes?: string;
        dateInscription?: string;
      }>;
      gender: 'male' | 'female' | 'mixed';
    }>;
    createdAt: string;
    updatedAt: string;
  };

  // Traitements médicaux
  traitements: {
    id: string;
    sessionId?: string;
    jeuneId: string;
    jeuneNom: string;
    medicament: string;
    posologie: string;
    duree: string;
    dateDebut: string;
    dateFin: string;
    instructions?: string;
    ordonnance: boolean;
    dateCreation: string;
  };

  // Soins et consultations
  soins: {
    id: string;
    sessionId?: string;
    jeuneId: string;
    jeuneNom: string;
    type: 'soin' | 'consultation';
    titre: string;
    description: string;
    date: string;
    heure: string;
    soignant?: string;
    symptomes?: string;
    diagnostic?: string;
    traitement?: string;
    suivi?: boolean;
    dateCreation: string;
  };

  // Signatures électroniques pour les congés/repos
  signatures: {
    id: string;
    sessionId?: string;
    entryId: string;
    signature: string;
    signedAt: string;
    createdAt: string;
  };

  // Données administratives
  administratif: {
    id: string;
    sessionId?: string;
    exerciceEvacuationDone: boolean;
    emergencyContacts: Array<{
      id: number;
      label: string;
      number: string;
      description: string;
    }>;
    hospitalDetails: {
      nom: string;
      adresse: string;
      telephone: string;
    };
    acmDocuments: {
      declarationACM: boolean;
      projetEducatif: boolean;
      projetPedagogique: boolean;
      registrePresence: boolean;
      planEvacuationConsignes: boolean;
      panneauInterdictionFumer: boolean;
      adressesUrgence: boolean;
      tableauTemperatures: boolean;
      menusSemaine: boolean;
      protocoleSanitaire: boolean;
      assurances: boolean;
      conventionsPartenaires: boolean;
    };
    checklistData: { [key: string]: { [key: string]: boolean } };
    createdAt: string;
    updatedAt: string;
  };

  // Main courante events
  mainCouranteEvents: {
    id: string;
    sessionId: string;
    date: string;
    time: string;
    description: string;
    selectedMembers: string[];
    selectedJeunes: string[];
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
  };
}

class LocalDatabase {
  private dbName = 'CVJDatabase';
  private version = 8; // Augmenter la version pour ajouter piecesComptables
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Base de données initialisée avec version', this.version);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        console.log('Mise à jour de la base de données...', event.oldVersion, '->', event.newVersion);
        
        // Créer les tables si elles n'existent pas
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
          console.log('Table sessions créée');
        }
        if (!db.objectStoreNames.contains('animateurs')) {
          const animateursStore = db.createObjectStore('animateurs', { keyPath: 'id' });
          animateursStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table animateurs créée');
        }
        if (!db.objectStoreNames.contains('jeunes')) {
          const jeunesStore = db.createObjectStore('jeunes', { keyPath: 'id' });
          jeunesStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table jeunes créée');
        }
        if (!db.objectStoreNames.contains('groupes')) {
          const groupesStore = db.createObjectStore('groupes', { keyPath: 'id' });
          groupesStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table groupes créée');
        }
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table events créée');
        }
        if (!db.objectStoreNames.contains('plannings')) {
          const planningsStore = db.createObjectStore('plannings', { keyPath: 'id' });
          planningsStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table plannings créée');
        }
        if (!db.objectStoreNames.contains('roomData')) {
          const roomDataStore = db.createObjectStore('roomData', { keyPath: 'id' });
          roomDataStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table roomData créée');
        }
        if (!db.objectStoreNames.contains('traitements')) {
          const traitementsStore = db.createObjectStore('traitements', { keyPath: 'id' });
          traitementsStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table traitements créée');
        }
        if (!db.objectStoreNames.contains('soins')) {
          const soinsStore = db.createObjectStore('soins', { keyPath: 'id' });
          soinsStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table soins créée');
        }
        if (!db.objectStoreNames.contains('signatures')) {
          const signaturesStore = db.createObjectStore('signatures', { keyPath: 'id' });
          signaturesStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table signatures créée');
        }
        if (!db.objectStoreNames.contains('administratif')) {
          const administratifStore = db.createObjectStore('administratif', { keyPath: 'id' });
          administratifStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table administratif créée');
        }
        if (!db.objectStoreNames.contains('mainCouranteEvents')) {
          const mainCouranteStore = db.createObjectStore('mainCouranteEvents', { keyPath: 'id' });
          mainCouranteStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table mainCouranteEvents créée');
        }
        if (!db.objectStoreNames.contains('piecesComptables')) {
          const piecesComptablesStore = db.createObjectStore('piecesComptables', { keyPath: 'id' });
          piecesComptablesStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Table piecesComptables créée');
        }
      };
    });
  }

  // Méthodes génériques CRUD
  async save<T extends keyof DatabaseSchema>(
    table: T, 
    data: DatabaseSchema[T]
  ): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    await store.put(data);
  }

  async saveMany<T extends keyof DatabaseSchema>(
    table: T, 
    dataArray: DatabaseSchema[T][]
  ): Promise<void> {
    if (!this.db) await this.init();
    
    console.log(`saveMany: Début sauvegarde de ${dataArray.length} entrées dans ${table}`);
    
    const transaction = this.db!.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      
      transaction.oncomplete = () => {
        console.log(`saveMany: ✅ Transaction complétée pour ${table}, ${completed} entrées sauvegardées`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.error(`saveMany: ❌ Erreur transaction pour ${table}:`, transaction.error);
        reject(transaction.error);
      };
      
      for (const data of dataArray) {
        const request = store.put(data);
        request.onsuccess = () => {
          completed++;
          console.log(`saveMany: Entrée ${completed}/${dataArray.length} sauvegardée dans ${table}`);
        };
        request.onerror = () => {
          console.error(`saveMany: Erreur sauvegarde entrée dans ${table}:`, request.error);
        };
      }
    });
  }

  async getAll<T extends keyof DatabaseSchema>(
    table: T, 
    sessionId?: string
  ): Promise<DatabaseSchema[T][]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([table], 'readonly');
    const store = transaction.objectStore(table);
    
    let result: DatabaseSchema[T][];
    
    if (sessionId && store.indexNames.contains('sessionId')) {
      // Utiliser l'index sessionId pour un filtrage efficace
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);
      result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // Récupérer toutes les données et les filtrer manuellement si nécessaire
      const request = store.getAll();
      const allData = await new Promise<DatabaseSchema[T][]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      // Si sessionId est fourni mais pas d'index, filtrer manuellement
      if (sessionId) {
        result = allData.filter((item: any) => item.sessionId === sessionId);
      } else {
        result = allData;
      }
    }
    
    return result;
  }

  async getById<T extends keyof DatabaseSchema>(
    table: T, 
    id: string | number
  ): Promise<DatabaseSchema[T] | undefined> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([table], 'readonly');
    const store = transaction.objectStore(table);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete<T extends keyof DatabaseSchema>(
    table: T, 
    id: string | number
  ): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear<T extends keyof DatabaseSchema>(table: T): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    await store.clear();
  }

  // Nettoyer les données orphelines et migrer vers une session
  async cleanOrphanedData(currentSessionId: string): Promise<void> {
    console.log('Nettoyage des données orphelines...');
    
    const tables: (keyof DatabaseSchema)[] = ['plannings', 'animateurs', 'jeunes', 'groupes', 'events', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'mainCouranteEvents'];
    
    for (const table of tables) {
      try {
        if (table === 'sessions') continue; // Skip sessions table
        
        const allData = await this.getAll(table);
        const orphanedData = allData.filter((item: any) => !item.sessionId);
        
        if (orphanedData.length > 0) {
          console.log(`Migration de ${orphanedData.length} entrées orphelines dans ${table} vers la session ${currentSessionId}`);
          
          // Migrer les données orphelines vers la session courante
          const migratedData = orphanedData.map((item: any) => ({
            ...item,
            sessionId: currentSessionId
          }));
          
          await this.saveMany(table, migratedData);
        }
      } catch (error) {
        console.error(`Erreur lors du nettoyage de ${table}:`, error);
      }
    }
    
    console.log('Nettoyage terminé');
  }

  // Migration depuis localStorage
  async migrateFromLocalStorage(): Promise<void> {
    console.log('Migration des données depuis localStorage...');
    
    // Migration des sessions
    const savedSessions = localStorage.getItem('vacation-sessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      await this.saveMany('sessions', sessions);
      console.log(`${sessions.length} sessions migrées`);
    }
    
    // Migration des animateurs
    const savedAnimateurs = localStorage.getItem('equipe-animateurs');
    if (savedAnimateurs) {
      const animateurs = JSON.parse(savedAnimateurs);
      await this.saveMany('animateurs', animateurs);
      console.log(`${animateurs.length} animateurs migrés`);
    }
    
    // Migration des événements
    const savedEvents = localStorage.getItem('youngster-events');
    if (savedEvents) {
      const events = JSON.parse(savedEvents);
      await this.saveMany('events', events);
      console.log(`${events.length} événements migrés`);
    }
    
    // Migration des plannings
    const savedPlannings = localStorage.getItem('plannings');
    if (savedPlannings) {
      const plannings = JSON.parse(savedPlannings).map((planning: any, index: number) => ({
        ...planning,
        id: planning.id || `planning_${index}_${Date.now()}`
      }));
      await this.saveMany('plannings', plannings);
      console.log(`${plannings.length} plannings migrés`);
    }
    
    console.log('Migration terminée');
  }

  // Export de toutes les données
  async exportAllData(): Promise<any> {
    const exportData: any = {};
    const tables: (keyof DatabaseSchema)[] = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'piecesComptables', 'mainCouranteEvents'];
    
    for (const table of tables) {
      try {
        const data = await this.getAll(table);
        exportData[table] = data;
      } catch (error) {
        console.error(`Erreur lors de l'export de ${table}:`, error);
        exportData[table] = [];
      }
    }
    
    return exportData;
  }

  // Import de toutes les données
  async importAllData(data: any): Promise<void> {
    const tables: (keyof DatabaseSchema)[] = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'piecesComptables', 'mainCouranteEvents'];
    
    for (const table of tables) {
      if (data[table] && Array.isArray(data[table])) {
        try {
          // Vider la table avant l'import
          await this.clear(table);
          // Importer les nouvelles données
          await this.saveMany(table, data[table]);
          console.log(`${data[table].length} entrées importées dans ${table}`);
        } catch (error) {
          console.error(`Erreur lors de l'import de ${table}:`, error);
        }
      }
    }
  }
}

export const localDB = new LocalDatabase();
