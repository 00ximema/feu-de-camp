import React from 'react';
import { Youngster } from "@/types/youngster";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface YoungsterListViewProps {
  youngsters: Youngster[];
  onClick?: (youngster: Youngster) => void;
}

const YoungsterListView: React.FC<YoungsterListViewProps> = ({ youngsters, onClick }) => {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Âge</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Ville</TableHead>
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
