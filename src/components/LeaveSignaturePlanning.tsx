import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Download, FileSignature, Trash2, Eye } from "lucide-react";
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LeaveEntry {
  id: string;
  staffName: string;
  leaves: Array<{
    type: 'leave' | 'recovery';
    startDate: string;
    endDate: string;
    notes?: string;
  }>;
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
  description?: string;
  notes?: string;
}

const LeaveSignaturePlanning = () => {
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [viewingSignature, setViewingSignature] = useState<string | null>(null);
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
      const memberLeaveData: { [memberId: string]: {
        member: any;
        leaves: Array<{
          type: 'leave' | 'recovery';
          startDate: string;
          endDate: string;
          notes?: string;
        }>;
      } } = {};
      
      // Collecter tous les congés/repos par membre
      plannings.forEach(planning => {
        if (planning.data) {
          planning.data.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
              if (cell.event && 
                  (cell.timeSlot === 'Congés' || cell.timeSlot === 'Repos récupérateurs') &&
                  cell.event.assignedMembers) {
                
                cell.event.assignedMembers.forEach(member => {
                  if (!memberLeaveData[member.id]) {
                    memberLeaveData[member.id] = {
                      member,
                      leaves: []
                    };
                  }
                  
                  memberLeaveData[member.id].leaves.push({
                    type: cell.timeSlot === 'Congés' ? 'leave' : 'recovery',
                    startDate: cell.event!.startDate || cell.date,
                    endDate: cell.event!.endDate || cell.date,
                    notes: cell.event!.notes || cell.event!.description
                  });
                });
              }
            });
          });
        }
      });

      // Créer une seule entrée par membre avec tous ses congés/repos
      const entries: LeaveEntry[] = Object.values(memberLeaveData).map(({ member, leaves }) => {
        return {
          id: member.id, // Une seule entrée par membre
          staffName: `${member.prenom} ${member.nom}`,
          leaves: leaves, // Garder le détail de tous les congés/repos
          isSigned: false,
          signedAt: undefined
        };
      });

      setLeaveEntries(entries);
      console.log('Entrées de congés/repos chargées (regroupées par membre):', entries);
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
    try {
      console.log('Export PDF rapport signatures démarré...');

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
      
      let yPosition = 50;
      
      // Tableau des entrées avec signatures
      const entriesWithSignatureStatus = leaveEntries.map(entry => {
        const memberSignatures = signatures.filter(s => 
          s.entryId === entry.id || s.entryId.startsWith(`${entry.id}-`)
        );
        const latestSignature = memberSignatures.sort((a, b) => 
          new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
        )[0];
        
        return {
          ...entry,
          isSigned: memberSignatures.length > 0,
          signedAt: latestSignature?.signedAt,
          signature: latestSignature?.signature
        };
      });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Résumé des signatures', 15, yPosition);
      yPosition += 10;

      // En-têtes du tableau
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Personnel', 15, yPosition);
      pdf.text('Types', 60, yPosition);
      pdf.text('Périodes', 90, yPosition);
      pdf.text('Statut', 150, yPosition);
      yPosition += 7;

      // Lignes du tableau
      pdf.setFont('helvetica', 'normal');
      entriesWithSignatureStatus.forEach((entry) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(entry.staffName, 15, yPosition);
        
        // Types de congés/repos
        const types = entry.leaves.map(l => l.type === 'leave' ? 'Congé' : 'Repos récup.').join(', ');
        pdf.text(types, 60, yPosition);
        
        // Périodes
        const periods = entry.leaves.map(l => 
          l.startDate === l.endDate 
            ? formatDateSafely(l.startDate)
            : `${formatDateSafely(l.startDate)}-${formatDateSafely(l.endDate)}`
        ).join(', ');
        pdf.text(periods, 90, yPosition);
        
        pdf.text(entry.isSigned ? 'Signé' : 'En attente', 150, yPosition);
        
        if (entry.isSigned && entry.signedAt) {
          pdf.setFontSize(8);
          pdf.text(`le ${formatDateSafely(entry.signedAt)}`, 150, yPosition + 3);
          pdf.setFontSize(9);
        }
        
        yPosition += 10;
      });

      // Ajouter les signatures visuelles
      yPosition += 15;
      const signedEntries = entriesWithSignatureStatus.filter(entry => entry.isSigned && entry.signature);
      
      if (signedEntries.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Signatures électroniques', 15, yPosition);
        yPosition += 15;

        for (const entry of signedEntries) {
          if (yPosition > 200) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          const leaveTypes = entry.leaves.map(l => l.type === 'leave' ? 'Congé' : 'Repos récupérateur').join(' + ');
          pdf.text(`${entry.staffName} - ${leaveTypes}`, 15, yPosition);
          yPosition += 5;
          
          if (entry.signature) {
            try {
              pdf.addImage(entry.signature, 'PNG', 15, yPosition, 80, 25);
              yPosition += 30;
            } catch (error) {
              console.error('Erreur ajout signature:', error);
              pdf.text('Signature non disponible', 15, yPosition);
              yPosition += 10;
            }
          }
          
          yPosition += 10;
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

  // Mettre à jour le statut des signatures en tenant compte des anciennes signatures
  const entriesWithSignatureStatus = leaveEntries.map(entry => {
    // Chercher toutes les signatures qui pourraient correspondre à ce membre
    // (anciennes signatures avec l'ancien format d'ID et nouvelles avec le nouveau format)
    const memberSignatures = signatures.filter(s => 
      s.entryId === entry.id || // Nouveau format (juste l'ID du membre)
      s.entryId.startsWith(`${entry.id}-`) // Ancien format (member.id-event.id)
    );
    
    const latestSignature = memberSignatures.sort((a, b) => 
      new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
    )[0];
    
    return {
      ...entry,
      isSigned: memberSignatures.length > 0,
      signedAt: latestSignature?.signedAt,
      signature: latestSignature?.signature
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <span>Signatures électroniques - Repos des personnels</span>
          </CardTitle>
          <CardDescription>
            Chaque membre du personnel signe une seule fois pour tous ses congés et repos récupérateurs du séjour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              {entriesWithSignatureStatus.length} membre(s) avec repos/congés • {' '}
              {entriesWithSignatureStatus.filter(e => e.isSigned).length} signature(s) complétée(s)
            </div>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter le rapport
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Personnel</TableHead>
                  <TableHead className="w-[150px]">Types de repos</TableHead>
                  <TableHead className="w-[200px]">Périodes</TableHead>
                  <TableHead className="w-[100px]">Statut</TableHead>
                  <TableHead className="w-[120px]">Signature</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithSignatureStatus.length > 0 ? (
                  entriesWithSignatureStatus.map((entry) => (
                     <TableRow key={entry.id} className="hover:bg-gray-50">
                       <TableCell className="font-medium">
                         {entry.staffName}
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-wrap gap-1">
                           {Array.from(new Set(entry.leaves.map(l => l.type))).map((type) => (
                             <Badge 
                               key={type}
                               variant={type === 'leave' ? 'default' : 'secondary'}
                               className="text-xs"
                             >
                               {type === 'leave' ? 'Congé' : 'Repos récup.'}
                             </Badge>
                           ))}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="space-y-1">
                           {entry.leaves.map((leave, index) => (
                             <div key={index} className="text-sm flex items-center gap-2">
                               <Badge 
                                 variant="outline" 
                                 className="text-xs px-1 py-0"
                               >
                                 {leave.type === 'leave' ? 'C' : 'R'}
                               </Badge>
                               <span>
                                 {leave.startDate === leave.endDate 
                                   ? formatDateSafely(leave.startDate)
                                   : `${formatDateSafely(leave.startDate)} → ${formatDateSafely(leave.endDate)}`
                                 }
                               </span>
                               {leave.notes && (
                                 <span className="text-xs text-gray-500 italic">
                                   ({leave.notes})
                                 </span>
                               )}
                             </div>
                           ))}
                         </div>
                       </TableCell>
                       <TableCell>
                         {entry.isSigned ? (
                           <div className="flex items-center gap-2">
                             <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                               ✓ Signé
                             </Badge>
                             {entry.signedAt && (
                               <span className="text-xs text-gray-500">
                                 {formatDateSafely(entry.signedAt)}
                               </span>
                             )}
                           </div>
                         ) : (
                           <Badge variant="outline" className="border-orange-300 text-orange-600">
                             En attente
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell>
                         {entry.signature && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setViewingSignature(entry.signature!)}
                             className="h-8 w-8 p-0"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                         )}
                       </TableCell>
                       <TableCell>
                         {entry.isSigned ? (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => deleteSignature(entry.id)}
                             className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4 mr-1" />
                             Supprimer
                           </Button>
                         ) : (
                           <Button
                             variant="default"
                             size="sm"
                             onClick={() => setSelectedEntry(entry.id)}
                             className="h-8"
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
                     <TableCell colSpan={6} className="text-center py-8">
                       <div className="flex flex-col items-center gap-2 text-gray-500">
                         <FileSignature className="h-8 w-8" />
                         <p>Aucun congé ou repos récupérateur à signer</p>
                         <p className="text-sm">Ajoutez des entrées dans le planning principal</p>
                       </div>
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

          {viewingSignature && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Visualisation de la signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <img 
                      src={viewingSignature} 
                      alt="Signature" 
                      className="max-w-full h-auto"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setViewingSignature(null)}>
                    Fermer
                  </Button>
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
