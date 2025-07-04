
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Users, Shuffle, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Youngster } from "@/types/youngster";
import { useJeunes } from "@/hooks/useJeunes";

interface Room {
  id: string;
  name: string;
  capacity: number;
  occupants: Youngster[];
}

interface RoomConfig {
  capacity: number;
  count: number;
}

const RoomManager = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({ capacity: 6, count: 1 });
  const { toast } = useToast();
  const { jeunes } = useJeunes();

  // Génération aléatoire des chambres
  const generateRandomRooms = () => {
    if (roomConfigs.length === 0) {
      toast({
        title: "Configuration requise",
        description: "Veuillez d'abord configurer les chambres",
        variant: "destructive"
      });
      return;
    }

    // Séparer garçons et filles
    const boys = jeunes.filter(j => j.genre?.toLowerCase() === 'masculin' || j.genre?.toLowerCase() === 'garçon' || j.genre?.toLowerCase() === 'm');
    const girls = jeunes.filter(j => j.genre?.toLowerCase() === 'féminin' || j.genre?.toLowerCase() === 'fille' || j.genre?.toLowerCase() === 'f');
    const unknown = jeunes.filter(j => !j.genre || (j.genre.toLowerCase() !== 'masculin' && j.genre.toLowerCase() !== 'garçon' && j.genre.toLowerCase() !== 'm' && j.genre.toLowerCase() !== 'féminin' && j.genre.toLowerCase() !== 'fille' && j.genre.toLowerCase() !== 'f'));

    // Trier par âge
    const sortByAge = (a: Youngster, b: Youngster) => a.age - b.age;
    boys.sort(sortByAge);
    girls.sort(sortByAge);
    unknown.sort(sortByAge);

    const newRooms: Room[] = [];
    let roomIndex = 1;

    // Créer les chambres selon la configuration
    roomConfigs.forEach(config => {
      for (let i = 0; i < config.count; i++) {
        newRooms.push({
          id: `room-${roomIndex}`,
          name: `Chambre ${roomIndex} (${config.capacity} places)`,
          capacity: config.capacity,
          occupants: []
        });
        roomIndex++;
      }
    });

    // Répartir les jeunes
    const allYoungsters = [...boys, ...girls, ...unknown];
    let currentRoomIndex = 0;
    
    allYoungsters.forEach(youngster => {
      // Trouver une chambre avec de la place
      while (currentRoomIndex < newRooms.length && newRooms[currentRoomIndex].occupants.length >= newRooms[currentRoomIndex].capacity) {
        currentRoomIndex++;
      }
      
      if (currentRoomIndex < newRooms.length) {
        newRooms[currentRoomIndex].occupants.push(youngster);
      }
    });

    setRooms(newRooms);
    
    const totalCapacity = newRooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalOccupants = newRooms.reduce((sum, room) => sum + room.occupants.length, 0);
    
    toast({
      title: "Répartition générée",
      description: `${totalOccupants} jeunes répartis dans ${newRooms.length} chambres (capacité totale: ${totalCapacity})`
    });
  };

  // Ajouter une configuration de chambre
  const addRoomConfig = () => {
    if (newConfig.capacity < 1 || newConfig.count < 1) {
      toast({
        title: "Erreur",
        description: "La capacité et le nombre doivent être supérieurs à 0",
        variant: "destructive"
      });
      return;
    }

    setRoomConfigs([...roomConfigs, { ...newConfig }]);
    setNewConfig({ capacity: 6, count: 1 });
    setShowConfigDialog(false);
  };

  // Supprimer une configuration
  const removeRoomConfig = (index: number) => {
    setRoomConfigs(roomConfigs.filter((_, i) => i !== index));
  };

  // Vider toutes les chambres
  const clearAllRooms = () => {
    setRooms([]);
  };

  const totalCapacity = roomConfigs.reduce((sum, config) => sum + (config.capacity * config.count), 0);
  const totalRooms = roomConfigs.reduce((sum, config) => sum + config.count, 0);

  return (
    <div className="space-y-6">
      {/* Configuration des chambres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Configuration des chambres</span>
              </CardTitle>
              <CardDescription>
                Configurez le nombre et la capacité des chambres disponibles
              </CardDescription>
            </div>
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une configuration de chambre</DialogTitle>
                  <DialogDescription>
                    Définissez le nombre de chambres et leur capacité
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="capacity">Capacité par chambre</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={newConfig.capacity}
                      onChange={(e) => setNewConfig({ ...newConfig, capacity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="count">Nombre de chambres</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      value={newConfig.count}
                      onChange={(e) => setNewConfig({ ...newConfig, count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <Button onClick={addRoomConfig} className="w-full">
                    Ajouter la configuration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {roomConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune configuration</h3>
              <p className="text-gray-500">Commencez par configurer vos chambres</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalRooms}</div>
                  <div className="text-sm text-blue-600">Chambres total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalCapacity}</div>
                  <div className="text-sm text-green-600">Capacité totale</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{jeunes.length}</div>
                  <div className="text-sm text-purple-600">Jeunes à répartir</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {roomConfigs.map((config, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{config.count} chambre{config.count > 1 ? 's' : ''}</Badge>
                      <span className="text-sm text-gray-600">
                        Capacité: {config.capacity} place{config.capacity > 1 ? 's' : ''} chacune
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoomConfig(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={generateRandomRooms} disabled={jeunes.length === 0}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Générer la répartition
                </Button>
                {rooms.length > 0 && (
                  <Button variant="outline" onClick={clearAllRooms}>
                    Vider les chambres
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affichage des chambres */}
      {rooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Répartition des chambres</span>
            </CardTitle>
            <CardDescription>
              Répartition actuelle des {jeunes.length} jeunes dans {rooms.length} chambres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className={room.occupants.length > room.capacity ? "border-red-300" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{room.name}</span>
                      <Badge variant={room.occupants.length > room.capacity ? "destructive" : "secondary"}>
                        {room.occupants.length}/{room.capacity}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {room.occupants.length === 0 ? (
                      <p className="text-gray-500 text-sm">Chambre vide</p>
                    ) : (
                      <div className="space-y-1">
                        {room.occupants.map((occupant) => (
                          <div key={occupant.id} className="flex items-center justify-between text-sm">
                            <span>{occupant.prenom} {occupant.nom}</span>
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline" className="text-xs">
                                {occupant.age} ans
                              </Badge>
                              {occupant.genre && (
                                <Badge variant="outline" className="text-xs">
                                  {occupant.genre.charAt(0).toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomManager;
