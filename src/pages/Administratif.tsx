
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Upload, ArrowLeft, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Youngster } from "@/types/youngster";

const Administratif = () => {
  const [youngsters, setYoungsters] = useState<Youngster[]>([]);
  const [checklistData, setChecklistData] = useState<{ [key: string]: { [key: string]: boolean } }>({});

  // Charger les jeunes depuis le localStorage au montage du composant
  useEffect(() => {
    const savedYoungsters = localStorage.getItem('imported-youngsters');
    if (savedYoungsters) {
      try {
        const parsedYoungsters = JSON.parse(savedYoungsters);
        setYoungsters(parsedYoungsters);
        
        // Initialiser les données de checklist
        const initialChecklistData: { [key: string]: { [key: string]: boolean } } = {};
        parsedYoungsters.forEach((youngster: Youngster) => {
          initialChecklistData[youngster.id] = {
            ficheRenseignements: false,
            ficheSanitaire: false,
            copieCNI: false,
            copieVaccins: false,
            autorisationSortie: false,
            copieCNIParents: false
          };
        });
        setChecklistData(initialChecklistData);
      } catch (error) {
        console.error('Erreur lors du chargement des jeunes:', error);
      }
    }
  }, []);

  const handleCheckboxChange = (youngesterId: string, documentType: string, checked: boolean) => {
    setChecklistData(prev => ({
      ...prev,
      [youngesterId]: {
        ...prev[youngesterId],
        [documentType]: checked
      }
    }));
  };

  const getCompletionPercentage = (youngesterId: string) => {
    const youngsterChecklist = checklistData[youngesterId];
    if (!youngsterChecklist) return 0;
    
    const totalItems = Object.keys(youngsterChecklist).length;
    const completedItems = Object.values(youngsterChecklist).filter(Boolean).length;
    
    return Math.round((completedItems / totalItems) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Administratif</h1>
            </div>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour accueil
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Check-List Table - Only show if youngsters are imported */}
        {youngsters.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Check-List Documents ({youngsters.length} jeunes)</span>
              </CardTitle>
              <CardDescription>
                Suivi des documents administratifs pour chaque jeune
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nom du jeune</TableHead>
                      <TableHead className="text-center">Fiche de renseignements</TableHead>
                      <TableHead className="text-center">Fiche sanitaire de liaison</TableHead>
                      <TableHead className="text-center">Copie CNI</TableHead>
                      <TableHead className="text-center">Copie des vaccins</TableHead>
                      <TableHead className="text-center">Autorisation de sortie</TableHead>
                      <TableHead className="text-center">Copie CNI parents</TableHead>
                      <TableHead className="text-center">Progression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {youngsters.map((youngster) => (
                      <TableRow key={youngster.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{youngster.prenom} {youngster.nom}</div>
                            <div className="text-sm text-gray-500">{youngster.age} ans</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheRenseignements || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'ficheRenseignements', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.ficheSanitaire || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'ficheSanitaire', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNI || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieCNI', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieVaccins || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieVaccins', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.autorisationSortie || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'autorisationSortie', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={checklistData[youngster.id]?.copieCNIParents || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(youngster.id, 'copieCNIParents', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  getCompletionPercentage(youngster.id) === 100 
                                    ? 'bg-green-500' 
                                    : getCompletionPercentage(youngster.id) > 50 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${getCompletionPercentage(youngster.id)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {getCompletionPercentage(youngster.id)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Note :</span> Cette liste se base sur les jeunes importés dans la section "Gestion des jeunes". 
                  Importez d'abord votre fichier Excel dans cette section pour voir apparaître la check-list.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documents</span>
              </CardTitle>
              <CardDescription>
                Gérer les documents administratifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Importer un fichier</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="mt-1"
                  />
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900">Importer un fichier</p>
                    <p className="text-sm text-gray-500">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX jusqu'à 10MB</p>
                </div>

                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Téléverser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rapports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Rapports</span>
              </CardTitle>
              <CardDescription>
                Générer et télécharger les rapports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Rapport journalier
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Liste des participants
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Planning équipe
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Bilan médical
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Administratif;
