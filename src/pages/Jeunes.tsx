
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, ArrowLeft, Home, Users2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useJeunes } from "@/hooks/useJeunes";
import { useGroups } from "@/hooks/useGroups";
import YoungsterCard from "@/components/YoungsterCard";
import YoungsterDetailsModal from "@/components/YoungsterDetailsModal";
import GroupsManager from "@/components/GroupsManager";
import RoomManager from "@/components/RoomManager";
import QuartiersLibres from "@/components/QuartiersLibres";
import { Youngster } from "@/types/youngster";

const Jeunes = () => {
  const { jeunes, addJeune, updateJeune, deleteJeune, isInitialized } = useJeunes();
  const { groupes } = useGroups();
  const [selectedYoungster, setSelectedYoungster] = useState<Youngster | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const stats = {
    total: jeunes.length,
    groupes: groupes.length
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestion des jeunes</h1>
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
                  <Button onClick={() => setShowAddModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un jeune
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {jeunes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun jeune</h3>
                    <p className="text-gray-500 mb-4">Commencez par ajouter des jeunes</p>
                    <Button onClick={() => setShowAddModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un jeune
                    </Button>
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
