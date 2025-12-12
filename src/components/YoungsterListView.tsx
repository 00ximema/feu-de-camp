import React from 'react';
import { Youngster } from "@/types/youngster";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortField = 'nom' | 'prenom' | 'age' | 'genre' | 'ville';
export type SortDirection = 'asc' | 'desc' | null;

interface YoungsterListViewProps {
  youngsters: Youngster[];
  onClick?: (youngster: Youngster) => void;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const YoungsterListView: React.FC<YoungsterListViewProps> = ({ 
  youngsters, 
  onClick,
  sortField,
  sortDirection,
  onSort
}) => {
  const getGenreColor = (genre?: string) => {
    if (!genre) return 'bg-muted text-muted-foreground';
    const g = genre.toLowerCase();
    if (g === 'masculin' || g === 'm' || g === 'garçon' || g === 'h' || g === 'homme') {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
    if (g === 'féminin' || g === 'f' || g === 'fille' || g === 'femme') {
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
    }
    return 'bg-muted text-muted-foreground';
  };

  const getGenreLabel = (genre?: string) => {
    if (!genre) return 'Non défini';
    const g = genre.toLowerCase();
    if (g === 'masculin' || g === 'm' || g === 'garçon' || g === 'h' || g === 'homme') {
      return 'Garçon';
    }
    if (g === 'féminin' || g === 'f' || g === 'fille' || g === 'femme') {
      return 'Fille';
    }
    return genre;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="nom">Nom</SortableHeader>
            <SortableHeader field="prenom">Prénom</SortableHeader>
            <SortableHeader field="age">Âge</SortableHeader>
            <SortableHeader field="genre">Genre</SortableHeader>
            <SortableHeader field="ville">Ville</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {youngsters.map((youngster) => (
            <TableRow 
              key={youngster.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onClick?.(youngster)}
            >
              <TableCell className="font-medium">{youngster.nom}</TableCell>
              <TableCell>{youngster.prenom}</TableCell>
              <TableCell>{youngster.age} ans</TableCell>
              <TableCell>
                <Badge className={getGenreColor(youngster.genre)}>
                  {getGenreLabel(youngster.genre)}
                </Badge>
              </TableCell>
              <TableCell>{youngster.ville || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default YoungsterListView;
