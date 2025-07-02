
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlanningItem {
  id: string;
  time: string;
  activity: string;
  responsible: string;
  location: string;
}

interface TablePlanningViewProps {
  planningData?: PlanningItem[];
}

const TablePlanningView: React.FC<TablePlanningViewProps> = ({ 
  planningData = [] 
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Heure</TableHead>
            <TableHead>Activité</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Lieu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planningData.length > 0 ? (
            planningData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.time}</TableCell>
                <TableCell>{item.activity}</TableCell>
                <TableCell>{item.responsible}</TableCell>
                <TableCell>{item.location}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Aucune activité planifiée
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TablePlanningView;
