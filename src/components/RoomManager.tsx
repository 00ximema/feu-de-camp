
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Users, Shuffle, Plus, Trash2, Edit, FileDown, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Youngster } from "@/types/youngster";
import { useJeunes } from "@/hooks/useJeunes";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import jsPDF from 'jspdf';

interface Room {
  id: string;
  name: string;
  capacity: number;
  occupants: Youngster[];
  gender: 'male' | 'female' | 'mixed';
}

interface RoomConfig {
  capacity: number;
  count: number;
  gender: 'male' | 'female';
}

interface RoomData {
  id: string;
  sessionId?: string;
  configs: RoomConfig[];
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

const RoomManager = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedYoungster, setSelectedYoungster] = useState<Youngster | null>(null);
  const [newConfig, setNewConfig] = useState({ capacity: 6, count: 1, gender: 'male' as 'male' | 'female' });
  const [newRoomName, setNewRoomName] = useState('');
  const { toast } = useToast();
  const { jeunes } = useJeunes();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les données sauvegardées
  useEffect(() => {
    const loadRoomData = async () => {
      if (!isInitialized || !currentSession) return;
      
      try {
        const roomDataId = `room_data_${currentSession.id}`;
        const savedData = await db.getById('plannings', roomDataId);
        
        if (savedData) {
          // Vérifier que les données ont la structure correcte pour RoomData
          if (savedData.configs && savedData.rooms) {
            const roomData = savedData as RoomData;
            setRoomConfigs(roomData.configs || []);
            setRooms(roomData.rooms || []);
            console.log('Données de répartition des chambres chargées:', roomData);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de chambres:', error);
      }
    };

    loadRoomData();
  }, [isInitialized, currentSession, db]);

  // Sauvegarder automatiquement les données
  const saveRoomData = async (configs: RoomConfig[], roomsData: Room[]) => {
    if (!isInitialized || !currentSession) return;
    
    try {
      const roomDataId = `room_data_${currentSession.id}`;
      const roomData: RoomData = {
        id: roomDataId,
        sessionId: currentSession.id,
        configs,
        rooms: roomsData,
        createdAt: Date.now().toString(),
        updatedAt: Date.now().toString()
      };

      await db.save('plannings', roomData);
      console.log('Données de répartition des chambres sauvegardées');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de chambres:', error);
    }
  };

  // Génération aléatoire des chambres avec séparation stricte
  const generateRandomRooms = async () => {
    if (roomConfigs.length === 0) {
      toast({
        title: "Configuration requise",
        description: "Veuillez d'abord configurer les chambres",
        variant: "destructive"
      });
      return;
    }

    const boys = jeunes.filter(j => 
      j.genre?.toLowerCase() === 'masculin' || 
      j.genre?.toLowerCase() === 'garçon' || 
      j.genre?.toLowerCase() === 'm' ||
      j.genre?.toLowerCase() === 'homme'
    );
    const girls = jeunes.filter(j => 
      j.genre?.toLowerCase() === 'féminin' || 
      j.genre?.toLowerCase() === 'fille' || 
      j.genre?.toLowerCase() === 'f' ||
      j.genre?.toLowerCase() === 'femme'
    );

    const sortByAge = (a: Youngster, b: Youngster) => a.age - b.age;
    boys.sort(sortByAge);
    girls.sort(sortByAge);

    const newRooms: Room[] = [];
    let roomIndex = 1;

    roomConfigs.forEach(config => {
      const genderLabel = config.gender === 'male' ? 'Garçons' : 'Filles';
      for (let i = 0; i < config.count; i++) {
        newRooms.push({
          id: `room-${roomIndex}`,
          name: `Chambre ${roomIndex} - ${genderLabel}`,
          capacity: config.capacity,
          occupants: [],
          gender: config.gender
        });
        roomIndex++;
      }
    });

    const maleRooms = newRooms.filter(room => room.gender === 'male');
    let currentMaleRoomIndex = 0;
    boys.forEach(boy => {
      if (currentMaleRoomIndex < maleRooms.length && 
          maleRooms[currentMaleRoomIndex].occupants.length < maleRooms[currentMaleRoomIndex].capacity) {
        maleRooms[currentMaleRoomIndex].occupants.push(boy);
      } else {
        currentMaleRoomIndex++;
        if (currentMaleRoomIndex < maleRooms.length) {
          maleRooms[currentMaleRoomIndex].occupants.push(boy);
        }
      }
    });

    const femaleRooms = newRooms.filter(room => room.gender === 'female');
    let currentFemaleRoomIndex = 0;
    girls.forEach(girl => {
      if (currentFemaleRoomIndex < femaleRooms.length && 
          femaleRooms[currentFemaleRoomIndex].occupants.length < femaleRooms[currentFemaleRoomIndex].capacity) {
        femaleRooms[currentFemaleRoomIndex].occupants.push(girl);
      } else {
        currentFemaleRoomIndex++;
        if (currentFemaleRoomIndex < femaleRooms.length) {
          femaleRooms[currentFemaleRoomIndex].occupants.push(girl);
        }
      }
    });

    setRooms(newRooms);
    await saveRoomData(roomConfigs, newRooms);
    
    const totalCapacity = newRooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalOccupants = newRooms.reduce((sum, room) => sum + room.occupants.length, 0);
    
    toast({
      title: "Répartition générée et sauvegardée",
      description: `${totalOccupants} jeunes répartis dans ${newRooms.length} chambres (capacité totale: ${totalCapacity})`
    });
  };

  // Ajouter une configuration de chambre
  const addRoomConfig = async () => {
    if (newConfig.capacity < 1 || newConfig.count < 1) {
      toast({
        title: "Erreur",
        description: "La capacité et le nombre doivent être supérieurs à 0",
        variant: "destructive"
      });
      return;
    }

    const updatedConfigs = [...roomConfigs, { ...newConfig }];
    setRoomConfigs(updatedConfigs);
    await saveRoomData(updatedConfigs, rooms);
    
    setNewConfig({ capacity: 6, count: 1, gender: 'male' });
    setShowConfigDialog(false);
  };

  // Supprimer une configuration
  const removeRoomConfig = async (index: number) => {
    const updatedConfigs = roomConfigs.filter((_, i) => i !== index);
    setRoomConfigs(updatedConfigs);
    await saveRoomData(updatedConfigs, rooms);
  };

  // Supprimer une chambre
  const deleteRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedRooms = rooms.filter(r => r.id !== roomId);
    setRooms(updatedRooms);
    await saveRoomData(roomConfigs, updatedRooms);
    
    if (room.occupants.length > 0) {
      toast({
        title: "Chambre supprimée et sauvegardée",
        description: `${room.name} supprimée. ${room.occupants.length} jeune(s) remis dans la liste des non-assignés.`
      });
    } else {
      toast({
        title: "Chambre supprimée et sauvegardée",
        description: `${room.name} a été supprimée`
      });
    }
  };

  // Modifier le nom d'une chambre
  const updateRoomName = async () => {
    if (!editingRoom || !newRoomName.trim()) return;
    
    const updatedRooms = rooms.map(room => 
      room.id === editingRoom.id 
        ? { ...room, name: newRoomName.trim() }
        : room
    );
    setRooms(updatedRooms);
    await saveRoomData(roomConfigs, updatedRooms);
    
    setShowEditDialog(false);
    setEditingRoom(null);
    setNewRoomName('');
    
    toast({
      title: "Chambre modifiée et sauvegardée",
      description: "Le nom de la chambre a été mis à jour"
    });
  };

  // Déplacer un jeune vers une autre chambre
  const moveYoungster = async (youngsterId: string, fromRoomId: string, toRoomId: string) => {
    const fromRoom = rooms.find(r => r.id === fromRoomId);
    const toRoom = rooms.find(r => r.id === toRoomId);
    const youngster = fromRoom?.occupants.find(y => y.id === youngsterId);
    
    if (!fromRoom || !toRoom || !youngster) return;

    const youngsterGender = youngster.genre?.toLowerCase();
    const isYoungsterMale = youngsterGender === 'masculin' || youngsterGender === 'garçon' || youngsterGender === 'm';
    const isYoungsterFemale = youngsterGender === 'féminin' || youngsterGender === 'fille' || youngsterGender === 'f';
    
    if ((toRoom.gender === 'male' && !isYoungsterMale) || 
        (toRoom.gender === 'female' && !isYoungsterFemale)) {
      toast({
        title: "Déplacement impossible",
        description: "Les garçons et les filles ne peuvent pas être dans la même chambre",
        variant: "destructive"
      });
      return;
    }

    if (toRoom.occupants.length >= toRoom.capacity) {
      toast({
        title: "Chambre pleine",
        description: "Cette chambre a atteint sa capacité maximale",
        variant: "destructive"
      });
      return;
    }

    const updatedRooms = rooms.map(room => {
      if (room.id === fromRoomId) {
        return { ...room, occupants: room.occupants.filter(y => y.id !== youngsterId) };
      }
      if (room.id === toRoomId) {
        return { ...room, occupants: [...room.occupants, youngster] };
      }
      return room;
    });

    setRooms(updatedRooms);
    await saveRoomData(roomConfigs, updatedRooms);
    
    toast({
      title: "Jeune déplacé et sauvegardé",
      description: `${youngster.prenom} ${youngster.nom} a été déplacé vers ${toRoom.name}`
    });
  };

  // Retirer un jeune d'une chambre
  const removeYoungsterFromRoom = async (youngsterId: string, roomId: string) => {
    const updatedRooms = rooms.map(room => 
      room.id === roomId 
        ? { ...room, occupants: room.occupants.filter(y => y.id !== youngsterId) }
        : room
    );
    setRooms(updatedRooms);
    await saveRoomData(roomConfigs, updatedRooms);
    
    const youngster = rooms.find(r => r.id === roomId)?.occupants.find(y => y.id === youngsterId);
    if (youngster) {
      toast({
        title: "Jeune retiré et sauvegardé",
        description: `${youngster.prenom} ${youngster.nom} a été retiré de la chambre`
      });
    }
  };

  // Générer le PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    doc.setFontSize(18);
    doc.text('Répartition des Chambres', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 20;

    doc.setFontSize(12);
    const totalOccupants = rooms.reduce((sum, room) => sum + room.occupants.length, 0);
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    
    doc.text(`Total jeunes: ${totalOccupants}`, 20, yPosition);
    doc.text(`Capacité totale: ${totalCapacity}`, 100, yPosition);
    doc.text(`Chambres: ${rooms.length}`, 160, yPosition);
    yPosition += 15;

    rooms.forEach((room) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(room.name, 20, yPosition);
      
      doc.setFontSize(10);
      const genderLabel = room.gender === 'male' ? 'Garçons' : 'Filles';
      doc.text(`${genderLabel} - ${room.occupants.length}/${room.capacity}`, 20, yPosition + 5);
      yPosition += 15;

      if (room.occupants.length === 0) {
        doc.setFontSize(10);
        doc.text('- Chambre vide', 25, yPosition);
        yPosition += 8;
      } else {
        room.occupants.forEach((occupant, index) => {
          doc.setFontSize(10);
          doc.text(`- ${occupant.prenom} ${occupant.nom} (${occupant.age} ans)`, 25, yPosition);
          yPosition += 8;
        });
      }
      
      yPosition += 5;
    });

    doc.save('repartition-chambres.pdf');
    
    toast({
      title: "PDF généré",
      description: "Le fichier PDF a été téléchargé avec succès"
    });
  };

  // Vider toutes les chambres
  const clearAllRooms = async () => {
    setRooms([]);
    await saveRoomData(roomConfigs, []);
    
    toast({
      title: "Chambres vidées et sauvegardées",
      description: "Toutes les chambres ont été supprimées"
    });
  };

  const totalCapacity = roomConfigs.reduce((sum, config) => sum + (config.capacity * config.count), 0);
  const totalRooms = roomConfigs.reduce((sum, config) => sum + config.count, 0);
  const unassignedYoungsters = jeunes.filter(jeune => 
    !rooms.some(room => room.occupants.some(occupant => occupant.id === jeune.id))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Configuration des chambres</span>
              </CardTitle>
              <CardDescription>
                Configurez le nombre et la capacité des chambres par genre
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
                    Définissez le nombre de chambres et leur capacité par genre
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gender">Genre</Label>
                    <Select value={newConfig.gender} onValueChange={(value: 'male' | 'female') => setNewConfig({ ...newConfig, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Garçons</SelectItem>
                        <SelectItem value="female">Filles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="text-sm text-purple-600">Jeunes total</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{unassignedYoungsters.length}</div>
                  <div className="text-sm text-orange-600">Non assignés</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {roomConfigs.map((config, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{config.count} chambre{config.count > 1 ? 's' : ''}</Badge>
                      <Badge variant={config.gender === 'male' ? 'default' : 'secondary'}>
                        {config.gender === 'male' ? 'Garçons' : 'Filles'}
                      </Badge>
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
                  <>
                    <Button variant="outline" onClick={generatePDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Exporter PDF
                    </Button>
                    <Button variant="outline" onClick={clearAllRooms}>
                      Vider les chambres
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {unassignedYoungsters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Jeunes non assignés ({unassignedYoungsters.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unassignedYoungsters.map((youngster) => (
                <div key={youngster.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{youngster.prenom} {youngster.nom}</span>
                    <Badge variant="outline" className="text-xs">
                      {youngster.age}a
                    </Badge>
                    {youngster.genre && (
                      <Badge variant="outline" className="text-xs">
                        {youngster.genre.charAt(0).toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{room.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingRoom(room);
                            setNewRoomName(room.name);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRoom(room.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Badge variant={room.occupants.length > room.capacity ? "destructive" : "secondary"}>
                          {room.occupants.length}/{room.capacity}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={room.gender === 'male' ? 'default' : 'secondary'}>
                        {room.gender === 'male' ? 'Garçons' : 'Filles'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {room.occupants.length === 0 ? (
                      <p className="text-gray-500 text-sm">Chambre vide</p>
                    ) : (
                      <div className="space-y-2">
                        {room.occupants.map((occupant) => (
                          <div key={occupant.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span>{occupant.prenom} {occupant.nom}</span>
                              <Badge variant="outline" className="text-xs">
                                {occupant.age}a
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Select onValueChange={(roomId) => moveYoungster(occupant.id, room.id, roomId)}>
                                <SelectTrigger className="w-8 h-8">
                                  <Edit className="h-3 w-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rooms
                                    .filter(r => r.id !== room.id && r.gender === room.gender && r.occupants.length < r.capacity)
                                    .map(r => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeYoungsterFromRoom(occupant.id, room.id)}
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la chambre</DialogTitle>
            <DialogDescription>
              Changez le nom ou le numéro de la chambre
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomName">Nom de la chambre</Label>
              <Input
                id="roomName"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Ex: Chambre 101, Suite Océan..."
              />
            </div>
            <Button onClick={updateRoomName} className="w-full" disabled={!newRoomName.trim()}>
              Modifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManager;
