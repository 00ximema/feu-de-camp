
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Users, Save, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

interface PlanningEvent {
  id: string;
  name: string;
  description?: string;
  color: string;
  assignedMember?: Animateur;
  type: 'activity' | 'duty' | 'leave' | 'recovery';
}

interface PlanningCell {
  date: string;
  timeSlot: string;
  event?: PlanningEvent;
}

interface PlanningConfig {
  name: string;
  startDate: string;
  endDate: string;
}

const PlanningTableGenerator = () => {
  const [config, setConfig] = useState<PlanningConfig>({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [planningData, setPlanningData] = useState<PlanningCell[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ date: string; timeSlot: string } | null>(null);
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [planningId, setPlanningId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ 
    name: '', 
    description: '', 
    color: 'bg-green-100 text-green-800',
    type: 'activity' as 'activity' | 'duty' | 'leave' | 'recovery',
    assignedMember: null as Animateur | null
  });
  const [isExporting, setIsExporting] = useState(false);
  const planningTableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  const timeSlots = [
    'Matin',
    'Déjeuner', 
    'Après-midi',
    'Dîner',
    'Veillées',
    'Astreintes',
    'Congés',
    'Repos récupérateurs'
  ];

  const eventColors = [
    'bg-green-100 text-green-800',
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-pink-100 text-pink-800',
    'bg-orange-100 text-orange-800',
    'bg-gray-100 text-gray-800'
  ];

  const eventTypes = [
    { value: 'activity', label: 'Activité' },
    { value: 'duty', label: 'Astreinte' },
    { value: 'leave', label: 'Congé' },
    { value: 'recovery', label: 'Repos récupérateur' }
  ];

  // Charger les animateurs depuis la base de données
  useEffect(() => {
    const loadAnimateurs = async () => {
      if (!isInitialized) return;
      
      try {
        const dbAnimateurs = await db.getAll('animateurs', currentSession?.id);
        setAnimateurs(dbAnimateurs);
        console.log('Animateurs chargés depuis la base de données:', dbAnimateurs);
      } catch (error) {
        console.error('Erreur lors du chargement des animateurs:', error);
      }
    };

    loadAnimateurs();
  }, [isInitialized, db, currentSession]);

  // Mettre à jour le nom du séjour avec celui de la session courante
  useEffect(() => {
    if (currentSession && !config.name) {
      setConfig(prev => ({ ...prev, name: currentSession.name }));
    }
  }, [currentSession, config.name]);

  const generateDates = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
  };

  const generatePlanning = () => {
    if (!config.name || !config.startDate || !config.endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const dates = generateDates(config.startDate, config.endDate);
    const cells: PlanningCell[] = [];

    dates.forEach(date => {
      timeSlots.forEach(timeSlot => {
        cells.push({
          date: date.toISOString().split('T')[0],
          timeSlot: timeSlot
        });
      });
    });

    setPlanningData(cells);
    setShowTable(true);
    setPlanningId(`planning_${Date.now()}`);
    
    toast({
      title: "Planning généré",
      description: `Planning "${config.name}" créé avec succès`
    });
  };

  const savePlanning = async () => {
    if (!isInitialized || !currentSession || !planningId) return;

    try {
      const planningToSave = {
        id: planningId,
        sessionId: currentSession.id,
        name: config.name,
        startDate: config.startDate,
        endDate: config.endDate,
        data: planningData,
        createdAt: new Date().toISOString()
      };

      await db.save('plannings', planningToSave);
      
      toast({
        title: "Planning sauvegardé",
        description: "Le planning a été enregistré avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le planning",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    console.log('Export PDF appelé');
    
    if (!planningTableRef.current || !showTable) {
      console.log('Pas de tableau à exporter');
      toast({
        title: "Erreur",
        description: "Aucun planning à exporter",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    console.log('Début de l\'export PDF');
    
    try {
      const uniqueDates = [...new Set(planningData.map(cell => cell.date))].sort();
      const totalDays = uniqueDates.length;
      
      console.log(`Export PDF - ${totalDays} jours détectés`);
      
      // Si plus de 7 jours, découper en chunks de 7 jours maximum
      if (totalDays > 7) {
        console.log('Export multi-pages');
        await exportMultiPagePDF(uniqueDates);
      } else {
        console.log('Export page unique');
        await exportSinglePagePDF();
      }

      toast({
        title: "Export réussi",
        description: `Le planning a été exporté en PDF`
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

  const exportSinglePagePDF = async () => {
    console.log('Début export page unique');
    const element = planningTableRef.current!;
    
    try {
      console.log('Capture de l\'élément avec html2canvas');
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: true
      });

      console.log('Canvas créé, génération du PDF');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Calcul des dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30; // Marges de 15mm de chaque côté
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Titre
      pdf.setFontSize(16);
      pdf.text(`Planning - ${config.name}`, 15, 15);
      pdf.setFontSize(12);
      pdf.text(`Du ${new Date(config.startDate).toLocaleDateString('fr-FR')} au ${new Date(config.endDate).toLocaleDateString('fr-FR')}`, 15, 25);

      // Image du planning
      const yPosition = 35;
      const maxImageHeight = pdfHeight - yPosition - 15; // Laisser 15mm en bas
      
      if (imgHeight > maxImageHeight) {
        // Si l'image est trop haute, la redimensionner
        const scaledHeight = maxImageHeight;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        pdf.addImage(imgData, 'PNG', 15, yPosition, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      }

      const fileName = `Planning_${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Sauvegarde du PDF:', fileName);
      pdf.save(fileName);
    } catch (error) {
      console.error('Erreur dans exportSinglePagePDF:', error);
      throw error;
    }
  };

  const exportMultiPagePDF = async (allDates: string[]) => {
    console.log('Début export multi-pages');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const daysPerPage = 7;
    const chunks = [];
    
    // Découper les dates en chunks de 7 jours
    for (let i = 0; i < allDates.length; i += daysPerPage) {
      chunks.push(allDates.slice(i, i + daysPerPage));
    }

    console.log(`${chunks.length} pages à générer`);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(`Génération page ${chunkIndex + 1}/${chunks.length}`);
      
      // Créer un tableau temporaire pour cette page
      const tempTable = createTemporaryTable(chunk);
      document.body.appendChild(tempTable);
      
      try {
        const canvas = await html2canvas(tempTable, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (chunkIndex > 0) {
          pdf.addPage();
        }
        
        // Titre pour chaque page
        pdf.setFontSize(16);
        pdf.text(`Planning - ${config.name} (Page ${chunkIndex + 1}/${chunks.length})`, 15, 15);
        pdf.setFontSize(12);
        const startDate = new Date(chunk[0]).toLocaleDateString('fr-FR');
        const endDate = new Date(chunk[chunk.length - 1]).toLocaleDateString('fr-FR');
        pdf.text(`Du ${startDate} au ${endDate}`, 15, 25);

        // Image
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxImageHeight = pdfHeight - 50;
        
        if (imgHeight > maxImageHeight) {
          const scaledHeight = maxImageHeight;
          const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
          pdf.addImage(imgData, 'PNG', 15, 35, scaledWidth, scaledHeight);
        } else {
          pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);
        }
        
      } finally {
        document.body.removeChild(tempTable);
      }
    }

    const fileName = `Planning_${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('Sauvegarde du PDF multi-pages:', fileName);
    pdf.save(fileName);
  };

  const createTemporaryTable = (dates: string[]) => {
    const table = document.createElement('div');
    table.style.position = 'absolute';
    table.style.left = '-9999px';
    table.style.backgroundColor = 'white';
    table.style.padding = '20px';
    table.style.width = '800px';
    
    const tableHTML = `
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; width: 100px;">
              Créneaux
            </th>
            ${dates.map(date => {
              const dateObj = new Date(date);
              const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
              const dateDisplay = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
              return `
                <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; text-align: center; width: 100px; font-weight: bold;">
                  <div>${dayName}.</div>
                  <div style="font-size: 10px; color: #666;">${dateDisplay}</div>
                </th>
              `;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${timeSlots.map(timeSlot => `
            <tr>
              <td style="border: 1px solid #000; padding: 8px; background-color: #f9f9f9; font-weight: bold; vertical-align: top;">
                ${timeSlot}
              </td>
              ${dates.map(date => {
                const cell = planningData.find(c => c.date === date && c.timeSlot === timeSlot);
                if (cell?.event) {
                  return `
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top; height: 50px;">
                      <div style="background-color: #e6ffe6; color: #006600; padding: 3px 6px; border-radius: 3px; font-size: 10px; margin-bottom: 3px; font-weight: bold;">
                        ${cell.event.name}
                      </div>
                      ${cell.event.assignedMember ? `
                        <div style="font-size: 9px; color: #666;">
                          👤 ${cell.event.assignedMember.prenom} ${cell.event.assignedMember.nom}
                        </div>
                      ` : ''}
                    </td>
                  `;
                }
                return `<td style="border: 1px solid #000; height: 50px; padding: 6px;"></td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    table.innerHTML = tableHTML;
    return table;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const uniqueDates = [...new Set(planningData.map(cell => cell.date))].sort();

  const addEvent = () => {
    if (!selectedCell || !newEvent.name) return;

    const requiresMember = ['Astreintes', 'Congés', 'Repos récupérateurs'].includes(selectedCell.timeSlot);
    if (requiresMember && !newEvent.assignedMember) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un membre de l'équipe pour ce créneau",
        variant: "destructive"
      });
      return;
    }

    const updatedData = planningData.map(cell => {
      if (cell.date === selectedCell.date && cell.timeSlot === selectedCell.timeSlot) {
        return {
          ...cell,
          event: {
            id: Date.now().toString(),
            name: newEvent.name,
            description: newEvent.description,
            color: newEvent.color,
            type: newEvent.type,
            assignedMember: newEvent.assignedMember
          }
        };
      }
      return cell;
    });

    setPlanningData(updatedData);
    setSelectedCell(null);
    setNewEvent({ 
      name: '', 
      description: '', 
      color: 'bg-green-100 text-green-800',
      type: 'activity',
      assignedMember: null
    });
    
    toast({
      title: "Événement ajouté",
      description: `"${newEvent.name}" a été ajouté au planning`
    });
  };

  const removeEvent = (date: string, timeSlot: string) => {
    const updatedData = planningData.map(cell => {
      if (cell.date === date && cell.timeSlot === timeSlot) {
        const { event, ...cellWithoutEvent } = cell;
        return cellWithoutEvent;
      }
      return cell;
    });

    setPlanningData(updatedData);
  };

  const isSpecialTimeSlot = (timeSlot: string) => {
    return ['Astreintes', 'Congés', 'Repos récupérateurs'].includes(timeSlot);
  };

  return (
    <div className="space-y-6">
      {/* Configuration du séjour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Configuration du séjour</span>
          </CardTitle>
          <CardDescription>
            Définir les dates de début et fin pour générer automatiquement le planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Nom du séjour</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder={currentSession?.name || "ex: Robillard"}
              />
            </div>
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Button onClick={generatePlanning} className="bg-blue-600 hover:bg-blue-700">
              Générer planning complet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planning Tableau */}
      {showTable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Planning Tableau - {config.name}</CardTitle>
                <CardDescription>Cliquez sur les cases pour ajouter des événements</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={exportToPDF} 
                  disabled={isExporting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {isExporting ? 'Export...' : 'Exporter PDF'}
                </Button>
                <Button onClick={savePlanning} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={planningTableRef} className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-50 text-left font-medium">
                      Créneaux
                    </th>
                    {uniqueDates.map(date => (
                      <th key={date} className="border border-gray-300 p-2 bg-gray-50 text-center min-w-[120px]">
                        <div className="text-sm">
                          <div className="font-medium">{getDayName(date)}.</div>
                          <div className="text-gray-600">{getDateDisplay(date)}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(timeSlot => (
                    <tr key={timeSlot}>
                      <td className="border border-gray-300 p-3 bg-gray-50 font-medium">
                        {timeSlot}
                      </td>
                      {uniqueDates.map(date => {
                        const cell = planningData.find(c => c.date === date && c.timeSlot === timeSlot);
                        return (
                          <td key={`${date}-${timeSlot}`} className="border border-gray-300 p-1 h-16 relative">
                            {cell?.event ? (
                              <div className="h-full flex flex-col justify-between p-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Badge className={cell.event.color} variant="secondary">
                                      {cell.event.name}
                                    </Badge>
                                    {cell.event.assignedMember && (
                                      <div className="text-xs text-gray-600 mt-1 flex items-center">
                                        <Users className="h-3 w-3 mr-1" />
                                        <span className="truncate">
                                          {cell.event.assignedMember.prenom} {cell.event.assignedMember.nom}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEvent(date, timeSlot)}
                                    className="h-6 w-6 p-0 hover:bg-red-100 ml-1 flex-shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                className="w-full h-full flex items-center justify-center hover:bg-gray-100"
                                onClick={() => setSelectedCell({ date, timeSlot })}
                              >
                                <Plus className="h-4 w-4 text-gray-400" />
                              </Button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog pour ajouter un événement */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type d'événement</Label>
              <Select 
                value={newEvent.type} 
                onValueChange={(value: 'activity' | 'duty' | 'leave' | 'recovery') => 
                  setNewEvent(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nom de l'événement</Label>
              <Input
                value={newEvent.name}
                onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Randonnées à poney"
              />
            </div>

            <div>
              <Label>Description (optionnelle)</Label>
              <Input
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Détails de l'activité..."
              />
            </div>

            {/* Sélection du membre de l'équipe pour les créneaux spéciaux */}
            {selectedCell && isSpecialTimeSlot(selectedCell.timeSlot) && (
              <div>
                <Label>Membre de l'équipe *</Label>
                <Select 
                  value={newEvent.assignedMember?.id.toString() || ''} 
                  onValueChange={(value) => {
                    const member = animateurs.find(a => a.id.toString() === value);
                    setNewEvent(prev => ({ ...prev, assignedMember: member || null }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {animateurs.map(animateur => (
                      <SelectItem key={animateur.id} value={animateur.id.toString()}>
                        {animateur.prenom} {animateur.nom} ({animateur.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Couleur</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {eventColors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${color} ${
                      newEvent.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={addEvent} disabled={!newEvent.name}>
                Ajouter
              </Button>
              <Button variant="outline" onClick={() => setSelectedCell(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningTableGenerator;
