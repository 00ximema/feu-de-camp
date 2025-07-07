
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Edit, Trash2, PenTool, Download } from "lucide-react";
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';
import { toast } from "sonner";

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

interface SignatureEntry {
  id: string;
  sessionId?: string;
  eventId: string;
  eventName: string;
  memberName: string;
  startDate: string;
  endDate: string;
  notes: string;
  signature?: string;
  signedAt?: string;
  createdAt: string;
}

const QuartiersLibres = () => {
  const [signatureEntries, setSignatureEntries] = useState<SignatureEntry[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SignatureEntry | null>(null);
  const [signature, setSignature] = useState('');
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  useEffect(() => {
    const loadSignatureEntries = async () => {
      if (!isInitialized || !currentSession) {
        setSignatureEntries([]);
        return;
      }
      
      try {
        const dbEntries = await db.getAll('signatures', currentSession.id);
        console.log('Entrées de signature chargées depuis la DB:', dbEntries);
        
        // Map database entries to SignatureEntry interface
        const formattedEntries = dbEntries.map((entry: any) => ({
          id: String(entry.id),
          sessionId: entry.sessionId,
          eventId: entry.eventId || '',
          eventName: entry.eventName || '',
          memberName: entry.memberName || '',
          startDate: entry.startDate || '',
          endDate: entry.endDate || '',
          notes: entry.notes || '',
          signature: entry.signature,
          signedAt: entry.signedAt,
          createdAt: entry.createdAt || new Date().toISOString()
        }));
        
        setSignatureEntries(formattedEntries);
      } catch (error) {
        console.error('Erreur lors du chargement des entrées de signature:', error);
        setSignatureEntries([]);
      }
    };

    loadSignatureEntries();
  }, [isInitialized, currentSession, db]);

  const generateSignatureEntry = (event: PlanningEvent) => {
    if (!event.notes) {
      toast.error("Veuillez ajouter des notes avant de générer l'entrée de signature");
      return;
    }
    
    if (!currentSession) {
      toast.error("Aucune session active");
      return;
    }

    const newEntry: SignatureEntry = {
      id: Date.now().toString(),
      sessionId: currentSession.id,
      eventId: event.id,
      eventName: event.name,
      memberName: event.assignedMembers?.[0] ? `${event.assignedMembers[0].prenom} ${event.assignedMembers[0].nom}` : 'Non assigné',
      startDate: event.startDate || '',
      endDate: event.endDate || '',
      notes: event.notes,
      createdAt: new Date().toISOString()
    };

    saveSignatureEntry(newEntry);
  };

  const saveSignatureEntry = async (entry: SignatureEntry) => {
    if (!currentSession) return;

    try {
      // Convert to database format
      const dbEntry = {
        id: parseInt(entry.id),
        sessionId: entry.sessionId,
        eventId: entry.eventId,
        eventName: entry.eventName,
        memberName: entry.memberName,
        startDate: entry.startDate,
        endDate: entry.endDate,
        notes: entry.notes,
        signature: entry.signature,
        signedAt: entry.signedAt,
        createdAt: entry.createdAt
      };
      
      await db.save('signatures', dbEntry);
      setSignatureEntries(prev => [...prev, entry]);
      toast.success("Entrée de signature créée avec succès");
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la création de l'entrée");
    }
  };

  const updateSignatureEntry = async (updatedEntry: SignatureEntry) => {
    if (!currentSession) return;

    try {
      // Convert to database format
      const dbEntry = {
        id: parseInt(updatedEntry.id),
        sessionId: updatedEntry.sessionId,
        eventId: updatedEntry.eventId,
        eventName: updatedEntry.eventName,
        memberName: updatedEntry.memberName,
        startDate: updatedEntry.startDate,
        endDate: updatedEntry.endDate,
        notes: updatedEntry.notes,
        signature: updatedEntry.signature,
        signedAt: updatedEntry.signedAt,
        createdAt: updatedEntry.createdAt
      };
      
      await db.save('signatures', dbEntry);
      setSignatureEntries(prev => prev.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      ));
      toast.success("Entrée mise à jour avec succès");
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteSignatureEntry = async (entryId: string) => {
    if (!currentSession) return;

    try {
      await db.delete('signatures', parseInt(entryId));
      setSignatureEntries(prev => prev.filter(entry => entry.id !== entryId));
      toast.success("Entrée supprimée avec succès");
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const signEntry = async (entryId: string) => {
    if (!signature.trim()) {
      toast.error("Veuillez saisir votre signature");
      return;
    }

    const entry = signatureEntries.find(e => e.id === entryId);
    if (!entry) return;

    const updatedEntry = {
      ...entry,
      signature: signature.trim(),
      signedAt: new Date().toISOString()
    };

    await updateSignatureEntry(updatedEntry);
    setSignature('');
    setEditingEntry(null);
  };

  const exportToPDF = () => {
    // Implementation for PDF export would go here
    toast.info("Fonctionnalité d'export PDF à implémenter");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Gestion des Quartiers Libres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Gérez les entrées de signature pour les congés et repos du personnel
            </p>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>

          {signatureEntries.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune entrée de signature</h3>
              <p className="text-gray-500">Les entrées de signature apparaîtront ici une fois créées depuis le planning</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Événement</TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatureEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.eventName}</TableCell>
                      <TableCell>{entry.memberName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Du {new Date(entry.startDate).toLocaleDateString('fr-FR')}</div>
                          <div>Au {new Date(entry.endDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.signature ? (
                          <Badge variant="default">Signé</Badge>
                        ) : (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {!entry.signature && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingEntry(entry)}
                            >
                              <PenTool className="h-3 w-3 mr-1" />
                              Signer
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSignatureEntry(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signer l'entrée</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label>Événement</Label>
                <p className="text-sm font-medium">{editingEntry.eventName}</p>
              </div>
              <div>
                <Label>Membre</Label>
                <p className="text-sm">{editingEntry.memberName}</p>
              </div>
              <div>
                <Label>Notes</Label>
                <p className="text-sm text-muted-foreground">{editingEntry.notes}</p>
              </div>
              <div>
                <Label htmlFor="signature">Signature électronique</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Tapez votre nom complet pour signer"
                />
              </div>
              <Button 
                className="w-full"
                onClick={() => signEntry(editingEntry.id)}
              >
                Signer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuartiersLibres;
