import React, { useState, useEffect } from 'react';
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
import { getEmailJSConfig, saveEmailJSConfig, EmailJSConfig } from '@/services/emailService';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';

interface EmailConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: () => void;
}

const EmailConfigDialog: React.FC<EmailConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfigured
}) => {
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    const config = getEmailJSConfig();
    if (config) {
      setServiceId(config.serviceId);
      setTemplateId(config.templateId);
      setPublicKey(config.publicKey);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!serviceId.trim() || !templateId.trim() || !publicKey.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const config: EmailJSConfig = {
      serviceId: serviceId.trim(),
      templateId: templateId.trim(),
      publicKey: publicKey.trim()
    };

    saveEmailJSConfig(config);
    toast.success('Configuration EmailJS enregistrée');
    onConfigured();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuration EmailJS</DialogTitle>
          <DialogDescription>
            Configurez vos identifiants EmailJS pour envoyer des emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-2">Pour obtenir ces identifiants :</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Créez un compte sur <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">emailjs.com <ExternalLink className="h-3 w-3" /></a></li>
              <li>Ajoutez un service email (Gmail, Outlook...)</li>
              <li>Créez un template avec les variables: {'{'}to_email{'}'}, {'{'}subject{'}'}, {'{'}event_date{'}'}, {'{'}event_time{'}'}, {'{'}event_description{'}'}, {'{'}persons_involved{'}'}</li>
              <li>Récupérez vos identifiants dans le dashboard</li>
            </ol>
          </div>

          <div>
            <Label htmlFor="serviceId">Service ID</Label>
            <Input
              id="serviceId"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="service_xxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="templateId">Template ID</Label>
            <Input
              id="templateId"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="template_xxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="publicKey">Public Key</Label>
            <Input
              id="publicKey"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxx"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailConfigDialog;
