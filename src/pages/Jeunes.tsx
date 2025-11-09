
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, ArrowLeft, Home, Users2, FileText, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useJeunes } from "@/hooks/useJeunes";
import { useGroups } from "@/hooks/useGroups";
import YoungsterCard from "@/components/YoungsterCard";
import YoungsterDetailsModal from "@/components/YoungsterDetailsModal";
import GroupsManager from "@/components/GroupsManager";
import RoomManager from "@/components/RoomManager";
import QuartiersLibres from "@/components/QuartiersLibres";
import { Youngster } from "@/types/youngster";
import { parseExcel } from "@/utils/excelParser";
import { toast } from "sonner";

const Jeunes = () => {
  const { jeunes, addJeune, addMultipleJeunes, updateJeune, deleteJeune, isInitialized } = useJeunes();
  const { groupes } = useGroups();
  const [selectedYoungster, setSelectedYoungster] = useState<Youngster | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = {
    total: jeunes.length,
    groupes: groupes.length
  };

  const handleExcelImport = async (file: File) => {
    setIsImporting(true);
    try {
      const parsedJeunes = await parseExcel(file);
      console.log('Jeunes parsés:', parsedJeunes);
      
      if (parsedJeunes.length === 0) {
        toast.error("Aucun jeune trouvé dans le fichier");
        return;
      }

      const addedJeunes = await addMultipleJeunes(parsedJeunes);
      
      if (addedJeunes.length > 0) {
        toast.success(`${addedJeunes.length} jeune(s) importé(s) avec succès`);
      } else {
        toast.error("Erreur lors de l'import des jeunes");
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error("Erreur lors de l'import du fichier Excel");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleExcelImport(file);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Gestion des jeunes</h1>
              <Badge variant="secondary">{stats.total} total</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="liste" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="liste" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Liste des jeunes
            </TabsTrigger>
            <TabsTrigger value="groupes" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Groupes
            </TabsTrigger>
            <TabsTrigger value="chambres" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Chambres
            </TabsTrigger>
            <TabsTrigger value="quartiers-libres" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quartiers libres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liste" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Jeunes ({stats.total})</span>
                    </CardTitle>
                    <CardDescription>Gérez les jeunes de la maison de la gendarmerie</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isImporting ? 'Import en cours...' : 'Importer Excel'}
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un jeune
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {jeunes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Aucun jeune</h3>
                    <p className="text-muted-foreground mb-4">Commencez par ajouter des jeunes ou importer un fichier Excel</p>
                    <div className="flex justify-center gap-2">
                      <Button onClick={() => setShowAddModal(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Ajouter un jeune
                      </Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importer Excel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jeunes.map((jeune) => (
                      <YoungsterCard
                        key={jeune.id}
                        youngster={jeune}
                        onClick={() => setSelectedYoungster(jeune)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groupes">
            <GroupsManager />
          </TabsContent>

          <TabsContent value="chambres">
            <RoomManager />
          </TabsContent>

          <TabsContent value="quartiers-libres">
            <QuartiersLibres />
          </TabsContent>
        </Tabs>

        {/* Modal pour les détails du jeune */}
        {selectedYoungster && (
          <YoungsterDetailsModal
            youngster={selectedYoungster}
            isOpen={!!selectedYoungster}
            onClose={() => setSelectedYoungster(null)}
            onUpdate={updateJeune}
            onDelete={deleteJeune}
          />
        )}

        {/* Modal pour ajouter un jeune */}
        {showAddModal && (
          <YoungsterDetailsModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={addJeune}
          />
        )}
      </main>
    </div>
  );
};

export default Jeunes;
