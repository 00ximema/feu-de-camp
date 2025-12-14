import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, ArrowLeft, Home, Users2, FileText, Upload, LayoutGrid, List, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useJeunes } from "@/hooks/useJeunes";
import { useGroups } from "@/hooks/useGroups";
import YoungsterCard from "@/components/YoungsterCard";
import YoungsterListView, { SortField, SortDirection } from "@/components/YoungsterListView";
import YoungsterDetailsModal from "@/components/YoungsterDetailsModal";
import GroupsManager from "@/components/GroupsManager";
import RoomManager from "@/components/RoomManager";
import QuartiersLibres from "@/components/QuartiersLibres";
import { Youngster } from "@/types/youngster";
import { parseExcel } from "@/utils/excelParser";
import { toast } from "sonner";

type ViewMode = 'cards' | 'list';
type GenderFilter = 'all' | 'boys' | 'girls';

const Jeunes = () => {
  const { jeunes, addJeune, addMultipleJeunes, updateJeune, deleteJeune, deleteAllJeunes, isInitialized } = useJeunes();
  const { groupes } = useGroups();
  const [selectedYoungster, setSelectedYoungster] = useState<Youngster | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGarcon = (genre?: string) => {
    if (!genre) return false;
    const g = genre.toLowerCase();
    return g === 'masculin' || g === 'm' || g === 'garçon' || g === 'h' || g === 'homme';
  };

  const isFille = (genre?: string) => {
    if (!genre) return false;
    const g = genre.toLowerCase();
    return g === 'féminin' || g === 'f' || g === 'fille' || g === 'femme';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedJeunes = useMemo(() => {
    let result = [...jeunes];
    
    // Filter by gender
    if (genderFilter === 'boys') {
      result = result.filter(j => isGarcon(j.genre));
    } else if (genderFilter === 'girls') {
      result = result.filter(j => isFille(j.genre));
    }
    
    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        
        switch (sortField) {
          case 'nom':
            aValue = (a.nom || '').toLowerCase();
            bValue = (b.nom || '').toLowerCase();
            break;
          case 'prenom':
            aValue = (a.prenom || '').toLowerCase();
            bValue = (b.prenom || '').toLowerCase();
            break;
          case 'age':
            aValue = a.age || 0;
            bValue = b.age || 0;
            break;
          case 'genre':
            aValue = (a.genre || '').toLowerCase();
            bValue = (b.genre || '').toLowerCase();
            break;
          case 'ville':
            aValue = (a.ville || '').toLowerCase();
            bValue = (b.ville || '').toLowerCase();
            break;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [jeunes, genderFilter, sortField, sortDirection]);

  const genderStats = useMemo(() => {
    const boys = jeunes.filter(j => isGarcon(j.genre)).length;
    const girls = jeunes.filter(j => isFille(j.genre)).length;
    return { boys, girls, undefined: jeunes.length - boys - girls };
  }, [jeunes]);

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
                      <span>Jeunes ({filteredAndSortedJeunes.length}/{stats.total})</span>
                    </CardTitle>
                    <CardDescription>Gérez les jeunes de votre séjour de vacances</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* Filtre garçons/filles */}
                    <ToggleGroup 
                      type="single" 
                      value={genderFilter} 
                      onValueChange={(value) => value && setGenderFilter(value as GenderFilter)}
                      className="border rounded-md"
                    >
                      <ToggleGroupItem value="all" aria-label="Tous" className="text-xs px-2">
                        Tous ({stats.total})
                      </ToggleGroupItem>
                      <ToggleGroupItem value="boys" aria-label="Garçons" className="text-xs px-2 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700">
                        Garçons ({genderStats.boys})
                      </ToggleGroupItem>
                      <ToggleGroupItem value="girls" aria-label="Filles" className="text-xs px-2 data-[state=on]:bg-pink-100 data-[state=on]:text-pink-700">
                        Filles ({genderStats.girls})
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Toggle vue */}
                    <ToggleGroup 
                      type="single" 
                      value={viewMode} 
                      onValueChange={(value) => value && setViewMode(value as ViewMode)}
                      className="border rounded-md"
                    >
                      <ToggleGroupItem value="cards" aria-label="Vue cartes">
                        <LayoutGrid className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="Vue liste">
                        <List className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    
                    {/* Bouton supprimer tout */}
                    {jeunes.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Tout supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer tous les jeunes ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Vous êtes sur le point de supprimer {jeunes.length} jeune(s) de la session actuelle.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                const success = await deleteAllJeunes();
                                if (success) {
                                  toast.success("Tous les jeunes ont été supprimés");
                                } else {
                                  toast.error("Erreur lors de la suppression");
                                }
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer tout
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
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
                {filteredAndSortedJeunes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {jeunes.length === 0 ? 'Aucun jeune' : 'Aucun résultat pour ce filtre'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {jeunes.length === 0 
                        ? 'Commencez par ajouter des jeunes ou importer un fichier Excel'
                        : 'Essayez un autre filtre'}
                    </p>
                    {jeunes.length === 0 && (
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
                    )}
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedJeunes.map((jeune) => (
                      <YoungsterCard
                        key={jeune.id}
                        youngster={jeune}
                        onClick={() => setSelectedYoungster(jeune)}
                      />
                    ))}
                  </div>
                ) : (
                  <YoungsterListView 
                    youngsters={filteredAndSortedJeunes}
                    onClick={(youngster) => setSelectedYoungster(youngster)}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
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
