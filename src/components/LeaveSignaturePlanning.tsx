
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, FileDown, Trash2, Edit, Info, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Animateur {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

interface LeaveEntry {
  id: string;
  animateurId: number;
  animateurNom: string;
  animateurPrenom: string;
  type: 'leave' | 'recovery';
  date: string;
  timeSlot: string;
  signature?: string;
  signedAt?: string;
}

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas background to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signature = canvas.toDataURL('image/png');
    onSave(signature);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Signez dans le cadre ci-dessous avec votre souris</p>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="border border-gray-300 rounded cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <div className="flex justify-center space-x-2">
        <Button onClick={clearCanvas} variant="outline" size="sm">
          Effacer
        </Button>
        <Button onClick={saveSignature} size="sm">
          Valider signature
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Annuler
        </Button>
      </div>
    </div>
  );
};

const LeaveSignaturePlanning = () => {
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LeaveEntry | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const planningRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  const loadLeaveData = async () => {
    if (!isInitialized || !currentSession) return;
    
    setIsLoading(true);
    
    try {
      console.log('Chargement des congés et repos récupérateurs...');
      
      // Charger les plannings pour extraire les congés et RR
      const plannings = await db.getAll('plannings', currentSession.id);
      const leaves: LeaveEntry[] = [];

      plannings.forEach(planning => {
        if (planning.data && Array.isArray(planning.data)) {
          planning.data.forEach((row: any[]) => {
            row.forEach((cell: any) => {
              if (cell.event && 
                  (cell.event.type === 'leave' || cell.event.type === 'recovery' || 
                   cell.timeSlot === 'Congés' || cell.timeSlot === 'Repos récupérateurs') &&
                  cell.event.assignedMembers && cell.event.assignedMembers.length > 0) {
                
                // Créer une entrée pour chaque membre assigné
                cell.event.assignedMembers.forEach((member: any) => {
                  const entryId = `${member.id}_${cell.date}_${cell.timeSlot}`;
                  
                  const existingEntry = leaves.find(entry => entry.id === entryId);

                  if (!existingEntry) {
                    leaves.push({
                      id: entryId,
                      animateurId: parseInt(member.id),
                      animateurNom: member.nom,
                      animateurPrenom: member.prenom,
                      type: cell.timeSlot === 'Congés' ? 'leave' : 'recovery',
                      date: cell.date,
                      timeSlot: cell.timeSlot
                    });
                  }
                });
              }
            });
          });
        }
      });

      // Charger les signatures existantes
      const signatures = await db.getAll('signatures', currentSession.id);
      
      // Associer les signatures aux entrées
      const leavesWithSignatures = leaves.map(entry => {
        const signature = signatures.find(sig => sig.entryId === entry.id);
        return signature ? { ...entry, signature: signature.signature, signedAt: signature.signedAt } : entry;
      });

      setLeaveEntries(leavesWithSignatures);
      console.log('Congés et RR chargés:', leavesWithSignatures.length);
      
      toast({
        title: "Données actualisées",
        description: `${leavesWithSignatures.length} congé(s) et repos récupérateur(s) trouvé(s)`,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données du planning",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, [isInitialized, currentSession]);

  const handleSignature = async (signature: string) => {
    if (!selectedEntry || !currentSession) return;

    try {
      // Sauvegarder la signature en base
      const signatureData = {
        id: `signature_${selectedEntry.id}_${Date.now()}`,
        sessionId: currentSession.id,
        entryId: selectedEntry.id,
        signature,
        signedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await db.save('signatures', signatureData);

      // Mettre à jour l'état local
      const updatedEntries = leaveEntries.map(entry => {
        if (entry.id === selectedEntry.id) {
          return {
            ...entry,
            signature,
            signedAt: new Date().toISOString()
          };
        }
        return entry;
      });

      setLeaveEntries(updatedEntries);
      setShowSignature(false);
      setSelectedEntry(null);

      toast({
        title: "Signature enregistrée",
        description: `Signature de ${selectedEntry.animateurPrenom} ${selectedEntry.animateurNom} enregistrée`
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la signature",
        variant: "destructive"
      });
    }
  };

  const removeSignature = async (entryId: string) => {
    if (!currentSession) return;

    try {
      // Supprimer la signature de la base
      const signatures = await db.getAll('signatures', currentSession.id);
      const signatureToDelete = signatures.find(sig => sig.entryId === entryId);
      
      if (signatureToDelete) {
        await db.delete('signatures', signatureToDelete.id);
      }

      // Mettre à jour l'état local
      const updatedEntries = leaveEntries.map(entry => {
        if (entry.id === entryId) {
          const { signature, signedAt, ...entryWithoutSignature } = entry;
          return entryWithoutSignature;
        }
        return entry;
      });

      setLeaveEntries(updatedEntries);
      toast({
        title: "Signature supprimée",
        description: "La signature a été supprimée"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la signature",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    if (!planningRef.current) {
      toast({
        title: "Erreur",
        description: "Aucun planning à exporter",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Créer un élément temporaire pour le PDF
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.background = 'white';
      tempElement.style.padding = '20px';
      tempElement.style.width = '800px';
      
      tempElement.innerHTML = `
        <h1 style="font-size: 24px; margin-bottom: 10px;">Repos des personnels</h1>
        <p style="font-size: 14px; margin-bottom: 20px;">Session: ${currentSession?.name || 'Non définie'} - Généré le: ${new Date().toLocaleDateString('fr-FR')}</p>
        ${planningRef.current.innerHTML}
      `;
      
      document.body.appendChild(tempElement);

      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempElement.scrollHeight
      });

      document.body.removeChild(tempElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      const fileName = `Repos_Personnels_${currentSession?.name?.replace(/\s+/g, '_') || 'Session'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export réussi",
        description: "Le planning des repos du personnel a été exporté en PDF"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le planning en PDF",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (leaveEntries.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        {/* Information sur les repos */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="h-5 w-5" />
              <span>Information importante - Repos du personnel</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">
              <strong>Les repos se prennent la veille au soir après le coucher des jeunes, jusqu'au lendemain à la même heure.</strong>
            </p>
            <p className="text-blue-600 text-sm mt-2">
              Cette règle garantit la continuité du service et le respect de la réglementation en vigueur.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Repos des personnels</span>
              </div>
              <Button onClick={loadLeaveData} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </CardTitle>
            <CardDescription>
              Aucun congé ou repos récupérateur trouvé dans les plannings actuels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Les congés et repos récupérateurs définis dans le planning principal apparaîtront ici pour signature.
              Cliquez sur "Actualiser" pour recharger les données du planning.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information sur les repos */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Info className="h-5 w-5" />
            <span>Information importante - Repos du personnel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            <strong>Les repos se prennent la veille au soir après le coucher des jeunes, jusqu'au lendemain à la même heure.</strong>
          </p>
          <p className="text-blue-600 text-sm mt-2">
            Cette règle garantit la continuité du service et le respect de la réglementation en vigueur.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Repos des personnels</span>
              </CardTitle>
              <CardDescription>
                Signature électronique des congés et repos récupérateurs
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={loadLeaveData} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button 
                onClick={exportToPDF} 
                disabled={isExporting}
                className="bg-red-600 hover:bg-red-700"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isExporting ? 'Export...' : 'Exporter PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Chargement des données...</span>
            </div>
          ) : (
            <div ref={planningRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre de l'équipe</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Créneau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.animateurPrenom} {entry.animateurNom}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.type === 'leave' ? 'secondary' : 'outline'}
                          className={entry.type === 'leave' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {entry.type === 'leave' ? 'Congé' : 'Repos Récup.'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell>{entry.timeSlot}</TableCell>
                      <TableCell>
                        {entry.signature ? (
                          <div className="flex items-center space-x-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Signé</span>
                            <img 
                              src={entry.signature} 
                              alt="Signature" 
                              className="h-6 w-12 object-contain border rounded"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">Non signé</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {entry.signature ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSignature(entry.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setShowSignature(true);
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Signer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de signature */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Signature électronique</DialogTitle>
            <DialogDescription>
              {selectedEntry && (
                <>
                  Signature pour {selectedEntry.animateurPrenom} {selectedEntry.animateurNom}
                  <br />
                  {selectedEntry.type === 'leave' ? 'Congé' : 'Repos Récupérateur'} - {new Date(selectedEntry.date).toLocaleDateString('fr-FR')} - {selectedEntry.timeSlot}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <SignatureCanvas
            onSave={handleSignature}
            onCancel={() => {
              setShowSignature(false);
              setSelectedEntry(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveSignaturePlanning;
