import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, User, AlertTriangle, Plus, FileText, ArrowLeft, Calendar, Clock, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Youngster } from "@/types/youngster";
import { useToast } from "@/hooks/use-toast";
import { parseExcel } from "@/utils/excelParser";
import YoungsterDetailsModal from "@/components/YoungsterDetailsModal";
import { useEvents } from "@/hooks/useEvents";

const Jeunes = () => {
  const [youngsters, setYoungsters] = useState<Youngster[]>([]);
  const [selectedYoungster, setSelectedYoungster] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedYoungsterForModal, setSelectedYoungsterForModal] = useState<Youngster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventType, setEventType] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const { toast } = useToast();
  const { events, addEvent } = useEvents();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Fichier sélectionné:', file);
    
    if (file) {
      console.log('Type de fichier:', file.type);
      console.log('Taille du fichier:', file.size);
      
      try {
        // Vérifier l'extension du fichier
        const fileName = file.name.toLowerCase();
        
        if (!fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
          throw new Error('Format de fichier non supporté. Utilisez uniquement .xlsx ou .xls');
        }
        
        // Parser Excel uniquement
        const parsedYoungsters = await parseExcel(file);
        
        console.log('Jeunes parsés:', parsedYoungsters);
        setYoungsters(parsedYoungsters);
        
        // Sauvegarder dans localStorage pour la page Administratif
        localStorage.setItem('imported-youngsters', JSON.stringify(parsedYoungsters));
        
        toast({
          title: "Import réussi",
          description: `${parsedYoungsters.length} jeunes ont été importés avec succès.`,
        });
      } catch (error) {
        console.error("Erreur lors du parsing:", error);
        toast({
          title: "Erreur d'import",
          description: error instanceof Error ? error.message : "Impossible de lire le fichier. Vérifiez le format.",
          variant: "destructive",
        });
      }
    }
  };

  const handleMedicalEvent = (eventType: string) => {
    setEventType(eventType);
    if (eventType === "consultation_medecin") {
      setShowAlert(true);
    }
  };

  const handleSaveEvent = () => {
    if (!selectedYoungster || !eventType || !eventDescription.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    const youngster = youngsters.find(y => y.id === selectedYoungster);
    if (!youngster) return;

    const event = addEvent(
      selectedYoungster,
      `${youngster.prenom} ${youngster.nom}`,
      eventType,
      eventDescription
    );

    toast({
      title: "Événement enregistré",
      description: `Événement "${eventType}" enregistré pour ${youngster.prenom} ${youngster.nom}`,
    });

    // Réinitialiser le formulaire
    setSelectedYoungster(null);
    setEventType('');
    setEventDescription('');
    setShowAlert(false);
  };

  const handleYoungsterClick = (youngster: Youngster) => {
    setSelectedYoungsterForModal(youngster);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedYoungsterForModal(null);
  };

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'blessure': 'Blessure',
      'consultation_medecin': 'Consultation médecin',
      'malaise': 'Malaise',
      'allergie': 'Réaction allergique',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des jeunes</h1>
                <p className="text-gray-600">Import Excel et suivi des événements</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert for medical consultation */}
        {showAlert && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Consultation médicale :</strong> Il faut contacter les parents + l'organisateur immédiatement.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Import Excel</span>
              </CardTitle>
              <CardDescription>
                Importer la liste des jeunes depuis un fichier Excel (.xlsx ou .xls)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900">Cliquer pour uploader</span>
                      <span className="text-sm text-gray-500"> ou glisser-déposer</span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Fichiers Excel (.xlsx, .xls) jusqu'à 10MB</p>
                </div>
                
                {youngsters.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          {youngsters.length} jeunes importés
                        </span>
                      </div>
                      <span className="text-sm text-green-600">
                        {events.length} événements enregistrés
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Saisir un événement</span>
              </CardTitle>
              <CardDescription>
                Enregistrer les événements médicaux et incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="youngster-select">Sélectionner un jeune</Label>
                  <Select value={selectedYoungster || undefined} onValueChange={setSelectedYoungster}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un jeune" />
                    </SelectTrigger>
                    <SelectContent>
                      {youngsters.map((youngster) => (
                        <SelectItem key={youngster.id} value={youngster.id}>
                          {youngster.prenom} {youngster.nom}
                        </SelectItem>
                      ))}
                      {youngsters.length === 0 && (
                        <SelectItem value="none" disabled>
                          Aucun jeune importé
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event-type">Type d'événement</Label>
                  <Select value={eventType} onValueChange={handleMedicalEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blessure">Blessure</SelectItem>
                      <SelectItem value="consultation_medecin">Consultation médecin</SelectItem>
                      <SelectItem value="malaise">Malaise</SelectItem>
                      <SelectItem value="allergie">Réaction allergique</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event-description">Description</Label>
                  <textarea
                    id="event-description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrire l'événement en détail..."
                  />
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedYoungster || !eventType || !eventDescription.trim()}
                  onClick={handleSaveEvent}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer l'événement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journal des événements */}
        {events.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Journal des événements ({events.length})</span>
              </CardTitle>
              <CardDescription>
                Historique de tous les événements enregistrés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{event.youngsterName}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.type === 'consultation_medecin' ? 'bg-red-100 text-red-800' :
                            event.type === 'blessure' ? 'bg-orange-100 text-orange-800' :
                            event.type === 'malaise' ? 'bg-yellow-100 text-yellow-800' :
                            event.type === 'allergie' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getEventTypeLabel(event.type)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">{event.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(event.timestamp).toLocaleTimeString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Youngsters Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Liste des jeunes ({youngsters.length})</CardTitle>
            <CardDescription>
              Jeunes actuellement enregistrés dans le système - Cliquez sur l'icône œil pour voir tous les détails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {youngsters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Aucun jeune enregistré</p>
                <p className="text-sm">Importez un fichier Excel pour commencer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Âge</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Transport</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {youngsters.map((youngster) => (
                      <TableRow key={youngster.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{youngster.nom}</TableCell>
                        <TableCell>{youngster.prenom}</TableCell>
                        <TableCell>{youngster.age}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            youngster.genre === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {youngster.genre === 'M' ? 'Garçon' : 'Fille'}
                          </span>
                        </TableCell>
                        <TableCell>{youngster.responsable}</TableCell>
                        <TableCell>{youngster.telephone}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{youngster.email}</TableCell>
                        <TableCell>{youngster.transport}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleYoungsterClick(youngster)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal for youngster details */}
        <YoungsterDetailsModal
          youngster={selectedYoungsterForModal}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </main>
    </div>
  );
};

export default Jeunes;
