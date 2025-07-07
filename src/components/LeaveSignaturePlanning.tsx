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

      // Créer une seule entrée par membre avec tous ses congés/repos (dédupliqués)
      const entries: LeaveEntry[] = Object.values(memberLeaveData).map(({ member, leaves }) => {
        // Déduplication des congés/repos
        const uniqueLeaves = leaves.filter((leave, index, array) => {
          return array.findIndex(l => 
            l.type === leave.type && 
            l.startDate === leave.startDate && 
            l.endDate === leave.endDate &&
            (l.notes || '') === (leave.notes || '')
          ) === index;
        });

        return {
          id: member.id, // Une seule entrée par membre
          staffName: `${member.prenom} ${member.nom}`,
          leaves: uniqueLeaves, // Congés/repos dédupliqués
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
      console.log('Export PDF rapport signatures demarr...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // En-tete professionnel
      pdf.setFillColor(59, 130, 246); // Bleu moderne
      pdf.rect(0, 0, 210, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CVJ MG', 15, 16);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Rapport des signatures - Repos du personnel', 60, 16);
      
      // Date de generation
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.text(`Genere le ${format(new Date(), 'dd/MM/yyyy a HH:mm', { locale: fr })}`, 15, 35);
      
      let yPosition = 45;
      
      // Preparer les donnees avec statut des signatures
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

      // Statistiques generales compactes
      const totalPersons = entriesWithSignatureStatus.length;
      const signedPersons = entriesWithSignatureStatus.filter(e => e.isSigned).length;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUME', 15, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Membres: ${totalPersons} | Signatures: ${signedPersons}/${totalPersons} | Taux: ${totalPersons > 0 ? Math.round((signedPersons/totalPersons)*100) : 0}%`, 20, yPosition);
      yPosition += 12;

      if (entriesWithSignatureStatus.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Aucun conge ou repos recuperateur enregistre.', 15, yPosition);
        pdf.save(`Rapport_Signatures_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
        
        toast({
          title: "Export reussi",
          description: "Le rapport des signatures a ete exporte en PDF",
        });
        return;
      }

      // Tableau detaille compact
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAIL DES SIGNATURES', 15, yPosition);
      yPosition += 8;

      // En-tetes du tableau
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPosition - 1, 195, yPosition - 1);
      
      pdf.text('PERSONNEL', 15, yPosition);
      pdf.text('TYPES', 70, yPosition);
      pdf.text('PERIODES', 110, yPosition);
      pdf.text('STATUT', 160, yPosition);
      yPosition += 4;
      pdf.line(15, yPosition, 195, yPosition);
      yPosition += 6;

      // Lignes du tableau compactes
      pdf.setFont('helvetica', 'normal');
      entriesWithSignatureStatus.forEach((entry, index) => {
        // Alternance de couleur de fond
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(15, yPosition - 3, 180, 8, 'F');
        }

        pdf.setFontSize(8);
        
        // Nom du personnel
        pdf.setFont('helvetica', 'bold');
        pdf.text(entry.staffName, 17, yPosition);
        
        pdf.setFont('helvetica', 'normal');
        
        // Types de conges/repos
        const uniqueTypes = Array.from(new Set(entry.leaves.map(l => l.type)));
        const typesText = uniqueTypes.map(t => t === 'leave' ? 'Conge' : 'Repos').join(' + ');
        pdf.text(typesText, 72, yPosition);
        
        // Nombre de periodes
        pdf.text(`${entry.leaves.length} periode(s)`, 112, yPosition);
        
        // Statut
        if (entry.isSigned) {
          pdf.setTextColor(0, 150, 0);
          pdf.text('SIGNE', 162, yPosition);
          if (entry.signedAt) {
            pdf.setFontSize(6);
            pdf.setTextColor(100, 100, 100);
            pdf.text(formatDateSafely(entry.signedAt), 162, yPosition + 2);
            pdf.setFontSize(8);
          }
        } else {
          pdf.setTextColor(255, 100, 0);
          pdf.text('EN ATTENTE', 162, yPosition);
        }
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 10;
        
        // Detail des periodes en mode compact
        if (entry.leaves.length > 1) {
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          
          entry.leaves.forEach((leave, leaveIndex) => {
            const periodText = leave.startDate === leave.endDate 
              ? formatDateSafely(leave.startDate)
              : `${formatDateSafely(leave.startDate)} au ${formatDateSafely(leave.endDate)}`;
            
            const leaveText = `${leave.type === 'leave' ? 'Conge' : 'Repos'}: ${periodText}`;
            const notes = leave.notes ? leave.notes.replace(/[^\w\s\-]/g, '') : '';
            const displayText = notes ? `${leaveText} ${notes}` : leaveText;
            
            pdf.text(`  - ${displayText}`, 20, yPosition);
            yPosition += 3;
          });
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          yPosition += 2;
        }
      });

      // Section signatures visuelles compacte
      yPosition += 8;
      const signedEntries = entriesWithSignatureStatus.filter(entry => entry.isSigned && entry.signature);
      
      if (signedEntries.length > 0 && yPosition < 220) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SIGNATURES ELECTRONIQUES', 15, yPosition);
        yPosition += 8;

        signedEntries.forEach((entry, index) => {
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }

          // Encadre compact pour chaque signature
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(15, yPosition - 3, 180, 25);
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${entry.staffName}`, 20, yPosition);
          
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          const leaveTypes = Array.from(new Set(entry.leaves.map(l => l.type)))
            .map(t => t === 'leave' ? 'Conge' : 'Repos').join(' + ');
          pdf.text(leaveTypes, 20, yPosition + 3);
          
          if (entry.signature) {
            try {
              pdf.addImage(entry.signature, 'PNG', 20, yPosition + 5, 35, 12);
            } catch (error) {
              console.error('Erreur ajout signature:', error);
              pdf.setFont('helvetica', 'italic');
              pdf.text('Signature non disponible', 20, yPosition + 10);
            }
          }
          
          yPosition += 30;
        });
      }
      
      // Pied de page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(128, 128, 128);
        pdf.line(15, 285, 195, 285);
        pdf.text(`CVJ MG - Rapport des signatures | Page ${i}/${pageCount}`, 15, 290);
        pdf.text(`Confidentiel - Usage interne uniquement`, 130, 290);
      }
      
      const fileName = `Rapport_Signatures_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export reussi",
        description: "Le rapport des signatures a ete exporte en PDF",
      });
      
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
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
