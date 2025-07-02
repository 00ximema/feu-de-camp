
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
  
  // Jeunes
  jeunes: {
    id: string;
    sessionId?: string;
    nom: string;
    prenom: string;
    age: number;
    telephone: string;
    email: string;
    adresse: string;
    allergies: string[];
    medicaments: string[];
    notes: string;
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
  
  // Plannings
  plannings: {
    id: string;
    sessionId?: string;
    date: string;
    animateurs: {
      id: number;
      heureDebut: string;
      heureFin: string;
      typeService: string;
    }[];
  };
}

class LocalDatabase {
  private dbName = 'CVJDatabase';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Créer les tables si elles n'existent pas
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('animateurs')) {
          const animateursStore = db.createObjectStore('animateurs', { keyPath: 'id' });
          animateursStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('jeunes')) {
          const jeunesStore = db.createObjectStore('jeunes', { keyPath: 'id' });
          jeunesStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('plannings')) {
          const planningsStore = db.createObjectStore('plannings', { keyPath: 'id' });
          planningsStore.createIndex('sessionId', 'sessionId', { unique: false });
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
    await store.delete(id);
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
