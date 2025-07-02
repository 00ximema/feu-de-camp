import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, Trash2, Calendar } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const SessionManager = () => {
  const { sessions, currentSession, createSession, deleteSession, switchSession } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour la session",
        variant: "destructive"
      });
      return;
    }

    await createSession(newSessionName.trim());
    setNewSessionName('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Session créée",
      description: `La session "${newSessionName}" a été créée avec succès`
    });

    // Forcer le rechargement de la page pour afficher les modules
    window.location.reload();
  };

  const handleDeleteSession = (sessionId: string, sessionName: string) => {
    deleteSession(sessionId);
    toast({
      title: "Session supprimée",
      description: `La session "${sessionName}" a été supprimée`
    });

    // Forcer le rechargement de la page
    window.location.reload();
  };

  const handleSwitchSession = (session: typeof currentSession) => {
    if (session) {
      switchSession(session);
      toast({
        title: "Session changée",
        description: `Vous êtes maintenant sur la session "${session.name}"`
      });

      // Forcer le rechargement de la page pour afficher les modules
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Calendar className="h-4 w-4 text-gray-600" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <span className="font-medium">
              {currentSession ? currentSession.name : 'Aucune session'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Sessions de séjour</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {sessions.length === 0 ? (
            <DropdownMenuItem disabled>
              Aucune session disponible
            </DropdownMenuItem>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between px-2 py-1">
                <DropdownMenuItem 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSwitchSession(session)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{session.name}</span>
                    <span className="text-xs text-gray-500">
                      Créé le {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {currentSession?.id === session.id && (
                    <span className="ml-2 h-2 w-2 bg-green-500 rounded-full"></span>
                  )}
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id, session.name);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
          
          <DropdownMenuSeparator />
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une nouvelle session
              </DropdownMenuItem>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle session</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-name">Nom de la session</Label>
                  <Input
                    id="session-name"
                    placeholder="Ex: Séjour été 2024, Camp de Pâques..."
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateSession();
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreateSession}>
                    Créer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SessionManager;
