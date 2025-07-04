
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, FileDown, Trash2, Edit } from "lucide-react";
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
        <p className="text-sm text-gray-600 mb-2">Signez dans le cadre ci-dessous</p>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="border border-gray-300 rounded cursor-crosshair"
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
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LeaveEntry | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const planningRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Charger les animateurs et les données de planning
  useEffect(() => {
    const loadData = async () => {
      if (!isInitialized || !currentSession) return;
      
      try {
        // Charger les animateurs
        const dbAnimateurs = await db.getAll('animateurs', currentSession.id);
        setAnimateurs(dbAnimateurs);

        // Charger les plannings pour extraire les congés et RR
        const plannings = await db.getAll('plannings', currentSession.id);
        const leaves: LeaveEntry[] = [];

        plannings.forEach(planning => {
          planning.data.forEach(cell => {
            if (cell.event && 
                (cell.event.type === 'leave' || cell.event.type === 'recovery') &&
                cell.event.assignedMember) {
              
              const existingEntry = leaves.find(entry => 
                entry.animateurId === cell.event!.assignedMember!.id &&
                entry.date === cell.date &&
                entry.timeSlot === cell.timeSlot
              );

              if (!existingEntry) {
                leaves.push({
                  id: `${cell.event.assignedMember.id}_${cell.date}_${cell.timeSlot}`,
                  animateurId: cell.event.assignedMember.id,
                  animateurNom: cell.event.assignedMember.nom,
                  animateurPrenom: cell.event.assignedMember.prenom,
                  type: cell.event.type as 'leave' | 'recovery',
                  date: cell.date,
                  timeSlot: cell.timeSlot
                });
              }
            }
          });
        });

        setLeaveEntries(leaves);
        console.log('Congés et RR chargés:', leaves);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();
  }, [isInitialized, db, currentSession]);

  const handleSignature = (signature: string) => {
    if (!selectedEntry) return;

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
  };

  const removeSignature = (entryId: string) => {
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
      const element = planningRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Titre
      pdf.setFontSize(16);
      pdf.text('Planning Congés et Repos Récupérateurs', 15, 15);
      pdf.setFontSize(12);
      pdf.text(`Session: ${currentSession?.name || 'Non définie'}`, 15, 25);
      pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 15, 35);

      // Calcul des dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxImageHeight = pdfHeight - 60;
      
      if (imgHeight > maxImageHeight) {
        const scaledHeight = maxImageHeight;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        pdf.addImage(imgData, 'PNG', 15, 45, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight);
      }

      const fileName = `Planning_Conges_RR_${currentSession?.name?.replace(/\s+/g, '_') || 'Session'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export réussi",
        description: "Le planning des congés a été exporté en PDF"
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

  const getUniqueAnimateurs = () => {
    const animateurMap = new Map<number, Animateur>();
    leaveEntries.forEach(entry => {
      animateurMap.set(entry.animateurId, {
        id: entry.animateurId,
        nom: entry.animateurNom,
        prenom: entry.animateurPrenom,
        role: animateurs.find(a => a.id === entry.animateurId)?.role || 'Animateur'
      });
    });
    return Array.from(animateurMap.values());
  };

  const getEntriesForAnimateur = (animateurId: number) => {
    return leaveEntries.filter(entry => entry.animateurId === animateurId);
  };

  const uniqueAnimateurs = getUniqueAnimateurs();

  if (leaveEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Planning Congés et Repos Récupérateurs</span>
          </CardTitle>
          <CardDescription>
            Aucun congé ou repos récupérateur trouvé dans les plannings actuels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Les congés et repos récupérateurs définis dans le planning principal apparaîtront ici pour signature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Planning Congés et Repos Récupérateurs</span>
              </CardTitle>
              <CardDescription>
                Signature électronique des congés et repos récupérateurs
              </CardDescription>
            </div>
            <Button 
              onClick={exportToPDF} 
              disabled={isExporting}
              className="bg-red-600 hover:bg-red-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isExporting ? 'Export...' : 'Exporter PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={planningRef} className="space-y-6">
            {uniqueAnimateurs.map(animateur => {
              const animateurEntries = getEntriesForAnimateur(animateur.id);
              
              return (
                <div key={animateur.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {animateur.prenom} {animateur.nom}
                      </h3>
                      <p className="text-sm text-gray-600">{animateur.role}</p>
                    </div>
                    <Badge variant="outline">
                      {animateurEntries.length} entrée{animateurEntries.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {animateurEntries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={entry.type === 'leave' ? 'secondary' : 'outline'}
                            className={entry.type === 'leave' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                          >
                            {entry.type === 'leave' ? 'Congé' : 'Repos Récup.'}
                          </Badge>
                          <div>
                            <p className="font-medium">
                              {new Date(entry.date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-sm text-gray-600">{entry.timeSlot}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {entry.signature ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Signé</span>
                              </div>
                              <img 
                                src={entry.signature} 
                                alt="Signature" 
                                className="h-8 w-16 object-contain border rounded"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSignature(entry.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>
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
