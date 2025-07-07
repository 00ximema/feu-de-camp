import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';

interface Animateur {
  id: string;
  sessionId?: string;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  email: string;
  role: string;
  formations: string[];
  documents: {
    id: number;
    nom: string;
    type: string;
    dateUpload: string;
    url: string;
  }[];
  notes: string;
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

interface PlanningData {
  date: string;
  timeSlot: string;
  event?: PlanningEvent;
}

const PlanningTableGenerator = () => {
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [planningData, setPlanningData] = useState<PlanningData[][]>([
    [
      { date: '2024-07-01', timeSlot: '08:00 - 09:00' },
      { date: '2024-07-01', timeSlot: '09:00 - 10:00' },
    ],
    [
      { date: '2024-07-02', timeSlot: '08:00 - 09:00' },
      { date: '2024-07-02', timeSlot: '09:00 - 10:00' },
    ],
  ]);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2024, 6, 1),
    to: new Date(2024, 6, 7),
  })
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  useEffect(() => {
    const loadAnimateurs = async () => {
      if (!isInitialized || !currentSession) return;
      
      try {
        const dbAnimateurs = await db.getAll('animateurs', currentSession.id);
        console.log('Animateurs chargés depuis la DB:', dbAnimateurs);
        setAnimateurs(dbAnimateurs.map(animateur => ({
          ...animateur,
          id: String(animateur.id) // Convert to string
        })));
      } catch (error) {
        console.error('Erreur lors du chargement des animateurs:', error);
      }
    };

    loadAnimateurs();
  }, [isInitialized, currentSession, db]);

  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Planning</h2>
          <p className="text-sm text-muted-foreground">
            Générez votre planning d'activités
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Choisissez une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Activité</TableHead>
              <TableHead>Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planningData.map((dayData, dayIndex) => (
              dayData.map((item, index) => (
                <TableRow key={`${dayIndex}-${index}`}>
                  <TableCell className="font-medium">{item.date}</TableCell>
                  <TableCell>{item.timeSlot}</TableCell>
                  <TableCell>
                    <Input type="text" placeholder="Nom de l'activité" />
                  </TableCell>
                  <TableCell>
                    <select className="w-full p-2 border rounded">
                      <option value="">Sélectionner un animateur</option>
                      {animateurs.map((animateur) => (
                        <option key={animateur.id} value={animateur.id}>
                          {animateur.prenom} {animateur.nom}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlanningTableGenerator;
