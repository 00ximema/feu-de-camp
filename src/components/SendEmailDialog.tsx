import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendEventEmail, EventEmailData } from '@/services/emailService';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: EventEmailData | null;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  isOpen,
  onClose,
  eventData
}) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    if (!eventData) {
      toast.error('Aucun événement sélectionné');
      return;
    }

    setSending(true);
    try {
      await sendEventEmail(email.trim(), eventData);
      toast.success('Email envoyé avec succès');
      setEmail('');
      onClose();
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  if (!eventData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer par email
          </DialogTitle>
          <DialogDescription>
            Envoyez les détails de cet événement par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <p><strong>Date :</strong> {eventData.date} à {eventData.time}</p>
            <p><strong>Description :</strong> {eventData.description.substring(0, 100)}{eventData.description.length > 100 ? '...' : ''}</p>
            {(eventData.teamMembers.length > 0 || eventData.jeunes.length > 0) && (
              <p><strong>Personnes :</strong> {[...eventData.teamMembers, ...eventData.jeunes].join(', ')}</p>
            )}
          </div>

          <div>
            <Label htmlFor="recipientEmail">Adresse email du destinataire</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Annuler
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailDialog;
