import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Database } from "lucide-react";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession, Session } from "@/hooks/useSession";

const DataManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedSessionForExport, setSelectedSessionForExport] = useState<string>('');
  const { db, isInitialized } = useLocalDatabase();
  const { sessions, currentSession } = useSession();

  const exportSessionData = async () => {
    if (!isInitialized) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée",
        variant: "destructive"
      });
      return;
    }

    console.log('=== DONNÉES SESSION AVANT EXPORT ===');
    console.log('Sessions disponibles:', sessions.map(s => ({ id: s.id, name: s.name })));
    console.log('Session courante:', currentSession ? { id: currentSession.id, name: currentSession.name } : 'Aucune');
    console.log('Session sélectionnée pour export:', selectedSessionForExport);

    const sessionToExport = selectedSessionForExport || currentSession?.id;
    if (!sessionToExport) {
      toast({
        title: "Erreur",
        description: "Aucune session sélectionnée pour l'export",
        variant: "destructive"
      });
      return;
    }

    const session = sessions.find(s => s.id === sessionToExport);
    if (!session) {
      toast({
        title: "Erreur",
        description: "Session introuvable",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      console.log('=== DÉBUT EXPORT SESSION ===');
      console.log('Session à exporter:', sessionToExport);
      console.log('Nom de la session:', session.name);
      
      const exportData: any = {
        session: session,
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0"
      };
      
      // Liste des tables à exporter pour cette session
      const tables = ['animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'mainCouranteEvents'];
      
      for (const table of tables) {
        try {
          console.log(`Export ${table} pour session ${sessionToExport}...`);
          const data = await db.getAll(table as any, sessionToExport);
          console.log(`${table}: ${data.length} entrées trouvées`);
          exportData[table] = data;
        } catch (error) {
          console.error(`Erreur lors de l'export de ${table}:`, error);
          exportData[table] = [];
        }
      }

      console.log('=== CONTENU EXPORT ===');
      for (const [tableName, tableData] of Object.entries(exportData)) {
        if (Array.isArray(tableData)) {
          console.log(`${tableName}: ${tableData.length} entrées`);
        }
      }

      // Créer le fichier JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Télécharger le fichier avec le nom de la session
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: `Session "${session.name}" exportée avec succès`
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

  const importSessionData = async (file: File) => {
    if (!isInitialized) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée",
        variant: "destructive"
      });
      return;
    }

    if (!currentSession) {
      toast({
        title: "Erreur",
        description: "Aucune session active. Créez d'abord une nouvelle session pour l'import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      console.log('=== DÉBUT IMPORT SESSION ===');
      const text = await file.text();
      console.log('Fichier lu, taille:', text.length);
      
      const importData = JSON.parse(text);
      console.log('Données parsées, structure:', Object.keys(importData));
      
      // Vérifier la structure du fichier d'export
      if (!importData.session || !importData.exportDate) {
        toast({
          title: "Format invalide",
          description: "Le fichier ne semble pas être une sauvegarde de session valide",
          variant: "destructive"
        });
        return;
      }

      // Confirmer l'import dans la session actuelle
      const confirmed = window.confirm(
        `Voulez-vous importer la session "${importData.session.name}" dans votre session actuelle "${currentSession.name}" ?\n\nCela remplacera toutes les données de la session actuelle.`
      );

      if (!confirmed) {
        toast({
          title: "Import annulé",
          description: "L'import a été annulé"
        });
        return;
      }
      
      // Liste des tables à importer
      const tables = ['animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif', 'mainCouranteEvents'];
      
      let totalImported = 0;
      const importResults = [];

      // Supprimer d'abord toutes les données existantes de la session actuelle
      console.log('Suppression des données existantes...');
      for (const tableName of tables) {
        try {
          const existingData = await db.getAll(tableName as any, currentSession.id);
          for (const item of existingData) {
            await db.delete(tableName as any, item.id);
          }
        } catch (error) {
          console.error(`Erreur lors de la suppression de ${tableName}:`, error);
        }
      }

      // Importer les nouvelles données en remplaçant le sessionId
      for (const [tableName, tableData] of Object.entries(importData)) {
        if (tables.includes(tableName) && Array.isArray(tableData)) {
          try {
            console.log(`Import de ${tableName}: ${(tableData as any[]).length} entrées`);
            
            // Mettre à jour le sessionId pour chaque élément
            const updatedData = (tableData as any[]).map(item => ({
              ...item,
              sessionId: currentSession.id
            }));
            
            await db.saveMany(tableName as any, updatedData);
            
            const count = updatedData.length;
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

      toast({
        title: "Import réussi",
        description: `${totalImported} entrées importées dans la session "${currentSession.name}"`,
      });
      
      // Recharger la page pour actualiser toutes les données
      console.log('Rechargement de la page dans 2 secondes...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
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
      importSessionData(file);
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
          <DialogTitle>Sauvegarde et import de session</DialogTitle>
          <DialogDescription>
            Sauvegardez ou importez les données d'une session complète (tout stocké en local sur votre PC)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Sauvegarder une session</h3>
            <p className="text-xs text-muted-foreground">
              Téléchargez toutes les données d'une session dans un fichier JSON
            </p>
            
            <div className="space-y-2">
              <Label>Session à sauvegarder</Label>
              <Select value={selectedSessionForExport} onValueChange={setSelectedSessionForExport}>
                <SelectTrigger>
                  <SelectValue placeholder={currentSession ? `Session actuelle: ${currentSession.name}` : "Sélectionner une session"} />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} {session.id === currentSession?.id && "(session actuelle)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={exportSessionData} 
              disabled={isExporting || !isInitialized || sessions.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Sauvegarde en cours...' : 'Télécharger la session'}
            </Button>
          </div>

          {/* Import */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Importer une session</h3>
            <p className="text-xs text-muted-foreground">
              Importez les données d'une session sauvegardée dans votre session actuelle
            </p>
            
            {!currentSession && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ Créez d'abord une session avant d'importer des données
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="import-file">Sélectionner un fichier de sauvegarde</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isImporting || !isInitialized || !currentSession}
              />
            </div>
            {isImporting && (
              <p className="text-xs text-muted-foreground">
                Import en cours...
              </p>
            )}
          </div>


          <div className="text-xs text-muted-foreground border-t pt-4">
            <p><strong>💾 Stockage local :</strong> Toutes vos données restent sur votre PC, rien n'est envoyé en ligne.</p>
            <p><strong>⚠️ Import :</strong> L'import remplacera les données de votre session actuelle.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataManager;