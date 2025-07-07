import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Download, FileSignature, Trash2 } from "lucide-react";
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LeaveEntry {
  id: string;
  staffName: string;
  type: 'leave' | 'recovery';
  startDate: string;
  endDate: string;
  notes?: string;
  isSigned: boolean;
  signedAt?: string;
}

interface SignatureData {
  id: string;
  sessionId?: string;
  entryId: string;
  signature: string;
  signedAt: string;
  createdAt: string;
}

interface PlanningEvent {
  id: string;
  name: string;
  type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
  assignedMembers?: Array<{
    id: string;
    nom: string;
    prenom: string;
    role: string;
  }>;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  selectedGroups?: string[];
  selectedJeunes?: string[];
  notes?: string;
}

const LeaveSignaturePlanning = () => {
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les données au démarrage
  useEffect(() => {
    if (isInitialized && currentSession) {
      loadLeaveEntries();
      loadSignatures();
    }
  }, [isInitialized, currentSession]);

  const loadLeaveEntries = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const plannings = await db.getAll('plannings', currentSession.id);
      const entries: LeaveEntry[] = [];
      
      plannings.forEach(planning => {
        if (planning.data) {
          planning.data.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
              if (cell.event && 
                  (cell.timeSlot === 'Congés' || cell.timeSlot === 'Repos récupérateurs') &&
                  cell.event.assignedMembers) {
                
                cell.event.assignedMembers.forEach(member => {
                  const entryId = `${member.id}-${cell.event!.id}`;
                  entries.push({
                    id: entryId,
                    staffName: `${member.prenom} ${member.nom}`,
                    type: cell.timeSlot === 'Congés' ? 'leave' : 'recovery',
                    startDate: cell.event!.startDate || cell.date,
                    endDate: cell.event!.endDate || cell.date,
                    notes: cell.event!.notes,
                    isSigned: false,
                    signedAt: undefined
                  });
                });
              }
            });
          });
        }
      });

      setLeaveEntries(entries);
      console.log('Entrées de congés/repos chargées:', entries);
    } catch (error) {
      console.error('Erreur lors du chargement des entrées:', error);
    }
  };

  const loadSignatures = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const dbSignatures = await db.getAll('signatures', currentSession.id);
      setSignatures(dbSignatures);
      console.log('Signatures chargées:', dbSignatures);
    } catch (error) {
      console.error('Erreur lors du chargement des signatures:', error);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    if (!selectedEntry || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();

    try {
      const newSignature: SignatureData = {
        id: `sig_${selectedEntry}_${Date.now()}`,
        sessionId: currentSession?.id,
        entryId: selectedEntry,
        signature: signatureData,
        signedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await db.save('signatures', newSignature);
      
      setSignatures(prev => [...prev, newSignature]);
      setLeaveEntries(prev => prev.map(entry => 
        entry.id === selectedEntry 
          ? { ...entry, isSigned: true, signedAt: newSignature.signedAt }
          : entry
      ));

      setSelectedEntry(null);
      clearSignature();

      toast({
        title: "Signature enregistrée",
        description: "La signature a été enregistrée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la signature.",
        variant: "destructive"
      });
    }
  };

  const deleteSignature = async (entryId: string) => {
    try {
      const signature = signatures.find(s => s.entryId === entryId);
      if (!signature) return;

      await db.delete('signatures', signature.id);
      
      setSignatures(prev => prev.filter(s => s.entryId !== entryId));
      setLeaveEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, isSigned: false, signedAt: undefined }
          : entry
      ));

      toast({
        title: "Signature supprimée",
        description: "La signature a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la signature.",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le rapport",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Export PDF rapport signatures démarré...');

      const originalElement = reportRef.current;
      
      const exportElement = document.createElement('div');
      exportElement.innerHTML = originalElement.innerHTML;
      exportElement.style.position = 'absolute';
      exportElement.style.left = '-9999px';
      exportElement.style.top = '0';
      exportElement.style.backgroundColor = 'white';
      exportElement.style.padding = '20px';
      exportElement.style.width = '800px';
      exportElement.style.fontFamily = 'Arial, sans-serif';
      
      // Supprimer les boutons d'action
      const buttons = exportElement.querySelectorAll('button');
      buttons.forEach(button => button.remove());
      
      document.body.appendChild(exportElement);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800
      });
      
      document.body.removeChild(exportElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // En-tête
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, 210, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('CVJ MG', 15, 17);
      
      pdf.setFontSize(14);
      pdf.text('Rapport des signatures - Repos des personnels', 60, 17);
      
      // Date
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 15, 35);
      
      // Image
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 45;
      let remainingHeight = imgHeight;
      
      while (remainingHeight > 0) {
        const pageHeight = pdfHeight - yPosition - 10;
        const currentHeight = Math.min(remainingHeight, pageHeight);
        
        pdf.addImage(
          imgData, 
          'PNG', 
          15, 
          yPosition, 
          imgWidth, 
          currentHeight
        );
        
        remainingHeight -= currentHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 20;
        }
      }
      
      const fileName = `Signatures_Repos_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export réussi",
        description: "Le rapport des signatures a été exporté en PDF",
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport en PDF",
        variant: "destructive"
      });
    }
  };

  const formatDateSafely = (dateString: string) => {
    try {
      if (!dateString) return 'Date non définie';
      const dateObj = new Date(dateString);
      if (!isValid(dateObj)) return 'Date invalide';
      return format(dateObj, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Erreur de date';
    }
  };

  // Mettre à jour le statut des signatures
  const entriesWithSignatureStatus = leaveEntries.map(entry => {
    const signature = signatures.find(s => s.entryId === entry.id);
    return {
      ...entry,
      isSigned: !!signature,
      signedAt: signature?.signedAt
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Signatures électroniques - Repos des personnels</span>
          </CardTitle>
          <CardDescription>
            Les membres du personnel doivent signer leurs congés et repos récupérateurs. Une seule signature par entrée est requise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exporter le rapport
            </Button>
          </div>

          <div ref={reportRef} className="bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personnel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Précisions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithSignatureStatus.length > 0 ? (
                  entriesWithSignatureStatus.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.staffName}</TableCell>
                      <TableCell>
                        <Badge variant={entry.type === 'leave' ? 'default' : 'secondary'}>
                          {entry.type === 'leave' ? 'Congé' : 'Repos récupérateur'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.startDate === entry.endDate 
                          ? formatDateSafely(entry.startDate)
                          : `${formatDateSafely(entry.startDate)} - ${formatDateSafely(entry.endDate)}`
                        }
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {entry.notes || '-'}
                      </TableCell>
                      <TableCell>
                        {entry.isSigned ? (
                          <div className="flex flex-col">
                            <Badge variant="default" className="bg-green-500">
                              Signé
                            </Badge>
                            {entry.signedAt && (
                              <span className="text-xs text-gray-500 mt-1">
                                {formatDateSafely(entry.signedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">
                            En attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.isSigned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSignature(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEntry(entry.id)}
                          >
                            <FileSignature className="h-4 w-4 mr-1" />
                            Signer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Aucun congé ou repos récupérateur à signer. 
                      Ajoutez des entrées dans le planning principal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {selectedEntry && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Signature électronique</CardTitle>
                <CardDescription>
                  Signez avec votre souris ou votre doigt dans la zone ci-dessous
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={200}
                      className="border border-gray-300 cursor-crosshair bg-white"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={saveSignature}>
                      Enregistrer la signature
                    </Button>
                    <Button variant="outline" onClick={clearSignature}>
                      Effacer
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveSignaturePlanning;
