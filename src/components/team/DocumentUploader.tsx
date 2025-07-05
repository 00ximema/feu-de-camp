
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentUploaderProps {
  showUploadDialog: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

const DocumentUploader = ({ showUploadDialog, onClose, onFileUpload }: DocumentUploaderProps) => {
  return (
    <Dialog open={showUploadDialog} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>
            Téléchargez un document pour ce membre (contrat, certificat, diplôme, etc.)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="document">Sélectionner un fichier</Label>
            <Input
              id="document"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileUpload(file);
                }
              }}
            />
            <p className="text-sm text-gray-500 mt-1">
              Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 5MB)
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploader;
