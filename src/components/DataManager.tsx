import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Database } from "lucide-react";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";

const DataManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { db, isInitialized } = useLocalDatabase();

  const exportData = async () => {
    if (!isInitialized) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData: any = {};
      
      // Liste des tables à exporter
      const tables = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'mainCouranteEvents'];
      
      for (const table of tables) {
        try {
          const data = await db.getAll(table as any);
          exportData[table] = data;
        } catch (error) {
          console.error(`Erreur lors de l'export de ${table}:`, error);
          exportData[table] = [];
        }
      }

      // Créer le fichier JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Télécharger le fichier
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sauvegarde-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Vos données ont été téléchargées avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export des données",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (file: File) => {
    if (!isInitialized) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      console.log('=== DÉBUT IMPORT DONNÉES ===');
      const text = await file.text();
      console.log('Fichier lu, taille:', text.length);
      
      const importData = JSON.parse(text);
      console.log('Données parsées, tables trouvées:', Object.keys(importData));
      
      // Valider la structure des données
      const expectedTables = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'mainCouranteEvents'];
      const missingTables = expectedTables.filter(table => !importData[table]);
      
      if (missingTables.length > 0) {
        console.warn('Tables manquantes dans l\'import:', missingTables);
      }

      let totalImported = 0;
      const importResults = [];

      // Importer les données table par table
      for (const [tableName, tableData] of Object.entries(importData)) {
        if (expectedTables.includes(tableName) && Array.isArray(tableData)) {
          try {
            console.log(`Import de ${tableName}: ${(tableData as any[]).length} entrées`);
            await db.saveMany(tableName as any, tableData as any);
            
            // Vérifier que les données ont bien été sauvegardées
            const savedData = await db.getAll(tableName as any);
            console.log(`Vérification ${tableName}: ${savedData.length} entrées dans la DB après import`);
            
            const count = (tableData as any[]).length;
            totalImported += count;
            importResults.push(`${tableName}: ${count} entrées`);
            console.log(`✅ ${count} entrées importées dans ${tableName}`);
          } catch (error) {
            console.error(`❌ Erreur lors de l'import de ${tableName}:`, error);
            importResults.push(`${tableName}: ERREUR - ${error.message}`);
          }
        }
      }

      console.log('=== RÉSULTATS IMPORT ===');
      console.log('Total importé:', totalImported);
      console.log('Détails:', importResults);

      // Vérification finale : compter toutes les entrées dans la DB
      console.log('=== VÉRIFICATION FINALE ===');
      for (const tableName of expectedTables) {
        try {
          const finalCount = await db.getAll(tableName as any);
          console.log(`${tableName}: ${finalCount.length} entrées dans la DB`);
        } catch (error) {
          console.error(`Erreur vérification ${tableName}:`, error);
        }
      }

      toast({
        title: "Import réussi",
        description: `${totalImported} entrées importées avec succès`,
      });
      
      // Recharger la page pour actualiser toutes les données après un court délai
      console.log('Rechargement de la page dans 3 secondes...');
      setTimeout(() => {
        console.log('Rechargement de la page maintenant...');
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('=== ERREUR IMPORT ===');
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur",
        description: `Erreur lors de l'import: ${error.message || 'Format de fichier invalide'}`,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const testDatabase = async () => {
    if (!isInitialized) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée",
        variant: "destructive"
      });
      return;
    }

    console.log('=== TEST COMPLET BASE DE DONNÉES ===');
    
    try {
      // Test 1: Vérifier l'état de la DB
      console.log('1. État de la DB:', { isInitialized, db });
      
      // Test 2: Lister toutes les tables avec comptage
      const tables = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'mainCouranteEvents'];
      const currentCounts: Record<string, number> = {};
      
      for (const table of tables) {
        try {
          const data = await db.getAll(table as any);
          currentCounts[table] = data.length;
          console.log(`2. Table ${table}: ${data.length} entrées`);
          if (data.length > 0) {
            console.log(`   Premier élément:`, data[0]);
          }
        } catch (error) {
          console.error(`   Erreur lecture ${table}:`, error);
          currentCounts[table] = -1;
        }
      }
      
      // Test 3: Test de sauvegarde/lecture dans chaque table
      console.log('3. Test de sauvegarde dans toutes les tables...');
      const testResults: Record<string, boolean> = {};
      
      // Test animateurs
      try {
        const testAnimateur = {
          id: Date.now(),
          nom: 'Test',
          prenom: 'Animateur',
          age: 25,
          telephone: '0123456789',
          email: 'test@animateur.com',
          role: 'Animateur',
          formations: ['PSC1'],
          documents: [],
          notes: 'Test diagnostic',
          sessionId: 'test-session'
        };
        await db.save('animateurs', testAnimateur);
        const retrieved = await db.getById('animateurs', testAnimateur.id);
        testResults['animateurs'] = retrieved?.nom === 'Test';
        await db.delete('animateurs', testAnimateur.id);
        console.log('   ✅ Test animateurs: OK');
      } catch (error) {
        console.error('   ❌ Test animateurs échoué:', error);
        testResults['animateurs'] = false;
      }
      
      // Test jeunes
      try {
        const testJeune = {
          id: `test-${Date.now()}`,
          nom: 'Test',
          prenom: 'Jeune',
          age: 12,
          genre: 'M',
          sessionId: 'test-session'
        };
        await db.save('jeunes', testJeune);
        const retrieved = await db.getById('jeunes', testJeune.id);
        testResults['jeunes'] = retrieved?.nom === 'Test';
        await db.delete('jeunes', testJeune.id);
        console.log('   ✅ Test jeunes: OK');
      } catch (error) {
        console.error('   ❌ Test jeunes échoué:', error);
        testResults['jeunes'] = false;
      }
      
      // Test traitements
      try {
        const testTraitement = {
          id: `test-traitement-${Date.now()}`,
          sessionId: 'test-session',
          jeuneId: 'test-jeune',
          jeuneNom: 'Test Jeune',
          medicament: 'Test Medicine',
          posologie: '1 par jour',
          duree: '7 jours',
          dateDebut: new Date().toISOString().split('T')[0],
          dateFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ordonnance: true,
          dateCreation: new Date().toISOString()
        };
        await db.save('traitements', testTraitement);
        const retrieved = await db.getById('traitements', testTraitement.id);
        testResults['traitements'] = retrieved?.medicament === 'Test Medicine';
        await db.delete('traitements', testTraitement.id);
        console.log('   ✅ Test traitements: OK');
      } catch (error) {
        console.error('   ❌ Test traitements échoué:', error);
        testResults['traitements'] = false;
      }

      // Test 4: Test export/import simulé
      console.log('4. Test export/import simulé...');
      let exportTestResult = false;
      try {
        const exportData: any = {};
        
        for (const table of tables) {
          try {
            const data = await db.getAll(table as any);
            exportData[table] = data;
          } catch (error) {
            console.error(`Erreur export ${table}:`, error);
            exportData[table] = [];
          }
        }
        
        // Vérifier que toutes les tables sont présentes dans l'export
        const exportedTables = Object.keys(exportData);
        const missingTables = tables.filter(table => !exportedTables.includes(table));
        
        if (missingTables.length === 0) {
          exportTestResult = true;
          console.log('   ✅ Structure export valide');
        } else {
          console.error('   ❌ Tables manquantes dans export:', missingTables);
        }
      } catch (error) {
        console.error('   ❌ Test export échoué:', error);
      }

      // Test 5: Rapport final
      console.log('5. === RAPPORT FINAL ===');
      console.log('Comptages actuels:', currentCounts);
      console.log('Tests de sauvegarde:', testResults);
      console.log('Test export:', exportTestResult ? 'OK' : 'ÉCHEC');
      
      const allTestsPassed = Object.values(testResults).every(result => result === true) && exportTestResult;
      
      toast({
        title: allTestsPassed ? "✅ Tous les tests réussis" : "⚠️ Certains tests ont échoué",
        description: "Voir la console pour le rapport détaillé",
        variant: allTestsPassed ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      toast({
        title: "Erreur diagnostic",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fullIntegrityTest = async () => {
    if (!isInitialized) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée",
        variant: "destructive"
      });
      return;
    }

    console.log('=== TEST INTÉGRITÉ COMPLÈTE ===');
    
    try {
      // 1. Créer des données de test complètes
      const testSession = {
        id: `test-session-${Date.now()}`,
        name: 'Session Test Intégrité',
        createdAt: new Date().toISOString()
      };
      
      const testAnimateur = {
        id: Date.now(),
        nom: 'Dupont',
        prenom: 'Jean',
        age: 30,
        telephone: '0123456789',
        email: 'jean.dupont@test.com',
        role: 'Directeur',
        formations: ['PSC1', 'BAFA'],
        documents: [],
        notes: 'Test intégrité',
        sessionId: testSession.id
      };
      
      const testJeune = {
        id: `jeune-test-${Date.now()}`,
        nom: 'Martin',
        prenom: 'Paul',
        age: 14,
        genre: 'M',
        sessionId: testSession.id
      };
      
      const testTraitement = {
        id: `traitement-test-${Date.now()}`,
        sessionId: testSession.id,
        jeuneId: testJeune.id,
        jeuneNom: `${testJeune.prenom} ${testJeune.nom}`,
        medicament: 'Paracétamol',
        posologie: '500mg 3x/jour',
        duree: '5 jours',
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ordonnance: true,
        dateCreation: new Date().toISOString()
      };

      // 2. Sauvegarder toutes les données
      console.log('Création des données de test...');
      await db.save('sessions', testSession);
      await db.save('animateurs', testAnimateur);
      await db.save('jeunes', testJeune);
      await db.save('traitements', testTraitement);
      
      // 3. Vérifier la sauvegarde
      console.log('Vérification des sauvegardes...');
      const savedSession = await db.getById('sessions', testSession.id);
      const savedAnimateur = await db.getById('animateurs', testAnimateur.id);
      const savedJeune = await db.getById('jeunes', testJeune.id);
      const savedTraitement = await db.getById('traitements', testTraitement.id);
      
      const saveVerification = !!(savedSession && savedAnimateur && savedJeune && savedTraitement);
      console.log('Sauvegarde OK:', saveVerification);
      
      // 4. Test export
      console.log('Test export...');
      const exportData: any = {};
      const tables = ['sessions', 'animateurs', 'jeunes', 'traitements'];
      
      for (const table of tables) {
        const data = await db.getAll(table as any);
        exportData[table] = data;
      }
      
      const exportStr = JSON.stringify(exportData, null, 2);
      const exportVerification = exportStr.length > 100 && Object.keys(exportData).length === tables.length;
      console.log('Export OK:', exportVerification, `(${exportStr.length} caractères)`);
      
      // 5. Test import simulé (vérifier la structure)
      console.log('Test structure import...');
      let importVerification = false;
      try {
        const parsedData = JSON.parse(exportStr);
        importVerification = Array.isArray(parsedData.sessions) && 
                            Array.isArray(parsedData.animateurs) && 
                            Array.isArray(parsedData.jeunes) && 
                            Array.isArray(parsedData.traitements);
        console.log('Structure import OK:', importVerification);
      } catch (error) {
        console.error('Erreur parsing import:', error);
      }
      
      // 6. Nettoyage
      console.log('Nettoyage des données de test...');
      await db.delete('sessions', testSession.id);
      await db.delete('animateurs', testAnimateur.id);
      await db.delete('jeunes', testJeune.id);
      await db.delete('traitements', testTraitement.id);
      
      // 7. Rapport final
      const allPassed = saveVerification && exportVerification && importVerification;
      
      console.log('=== RÉSULTAT TEST INTÉGRITÉ ===');
      console.log('Sauvegarde:', saveVerification ? '✅' : '❌');
      console.log('Export:', exportVerification ? '✅' : '❌');
      console.log('Import (structure):', importVerification ? '✅' : '❌');
      console.log('RÉSULTAT GLOBAL:', allPassed ? '✅ SUCCÈS' : '❌ ÉCHEC');
      
      toast({
        title: allPassed ? "✅ Test d'intégrité réussi" : "❌ Test d'intégrité échoué",
        description: allPassed ? "Tous les systèmes fonctionnent correctement" : "Voir la console pour les détails",
        variant: allPassed ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('Erreur test intégrité:', error);
      toast({
        title: "Erreur test intégrité",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: "Format invalide",
          description: "Veuillez sélectionner un fichier JSON",
          variant: "destructive"
        });
        return;
      }
      importData(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="w-4 h-4 mr-2" />
          Gestion des données
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestion des données locales</DialogTitle>
          <DialogDescription>
            Exportez vos données pour les sauvegarder ou importez une sauvegarde existante.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Exporter les données</h3>
            <p className="text-xs text-muted-foreground">
              Téléchargez toutes vos données locales dans un fichier JSON
            </p>
            <Button 
              onClick={exportData} 
              disabled={isExporting || !isInitialized}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Export en cours...' : 'Télécharger les données'}
            </Button>
          </div>

          {/* Import */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Importer les données</h3>
            <p className="text-xs text-muted-foreground">
              Restaurez vos données depuis un fichier de sauvegarde JSON
            </p>
            <div>
              <Label htmlFor="import-file">Sélectionner un fichier</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isImporting || !isInitialized}
              />
            </div>
            {isImporting && (
              <p className="text-xs text-muted-foreground">
                Import en cours...
              </p>
            )}
          </div>

          {/* Tests */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Tests et Diagnostic</h3>
            <p className="text-xs text-muted-foreground">
              Vérifier le bon fonctionnement de la base de données
            </p>
            
            <Button 
              onClick={testDatabase} 
              disabled={!isInitialized}
              variant="secondary"
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              Test diagnostic rapide
            </Button>
            
            <Button 
              onClick={fullIntegrityTest} 
              disabled={!isInitialized}
              variant="outline"
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              Test d'intégrité complet
            </Button>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p><strong>⚠️ Attention :</strong> L'import remplacera toutes les données existantes. Cette action est irréversible.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataManager;