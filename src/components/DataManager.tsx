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
      const tables = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif'];
      
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
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Valider la structure des données
      const expectedTables = ['sessions', 'animateurs', 'jeunes', 'groupes', 'events', 'plannings', 'roomData', 'traitements', 'soins', 'signatures', 'administratif'];
      const missingTables = expectedTables.filter(table => !importData[table]);
      
      if (missingTables.length > 0) {
        console.warn('Tables manquantes dans l\'import:', missingTables);
      }

      // Importer les données table par table
      for (const [tableName, tableData] of Object.entries(importData)) {
        if (expectedTables.includes(tableName) && Array.isArray(tableData)) {
          try {
            await db.saveMany(tableName as any, tableData as any);
            console.log(`${(tableData as any[]).length} entrées importées dans ${tableName}`);
          } catch (error) {
            console.error(`Erreur lors de l'import de ${tableName}:`, error);
          }
        }
      }

      toast({
        title: "Import réussi",
        description: "Vos données ont été importées avec succès"
      });
      
      // Recharger la page pour actualiser toutes les données
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'import des données. Vérifiez le format du fichier.",
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

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p><strong>⚠️ Attention :</strong> L'import remplacera toutes les données existantes. Cette action est irréversible.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataManager;