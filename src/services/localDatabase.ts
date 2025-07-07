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
  
  // Plannings - Updated to include more comprehensive planning data
  plannings: {
    id: string;
    sessionId?: string;
    data: Array<Array<{
      date: string;
      timeSlot: string;
      event?: {
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
      };
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
}

class LocalDatabase {
  private dbName = 'CVJDatabase';
  private version = 5; // Augmenter la version pour forcer la mise à jour
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
    
    const transaction = this.db!.transaction([table], 'readwrite');
    const store = transaction.objectStore(table);
    
    for (const data of dataArray) {
      await store.put(data);
    }
  }

  async getAll<T extends keyof DatabaseSchema>(
    table: T, 
    sessionId?: string
  ): Promise<DatabaseSchema[T][]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([table], 'readonly');
    const store = transaction.objectStore(table);
    
    let request;
    if (sessionId && store.indexNames.contains('sessionId')) {
      const index = store.index('sessionId');
      request = index.getAll(sessionId);
    } else {
      request = store.getAll();
    }
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
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
}

export const localDB = new LocalDatabase();
