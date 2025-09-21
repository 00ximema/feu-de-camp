import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AcmDocumentUploaderProps {
  showUploadDialog: boolean;
  onClose: () => void;
  onFileUpload: (file: File, documentType: string) => void;
  documentType: string;
  documentLabel: string;
}

const AcmDocumentUploader = ({ 
  showUploadDialog, 
  onClose, 
  onFileUpload, 
  documentType,
  documentLabel 
}: AcmDocumentUploaderProps) => {
  return (
    <Dialog open={showUploadDialog} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un document ACM</DialogTitle>
          <DialogDescription>
            Téléchargez le document : {documentLabel}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="acm-document">Sélectionner un fichier</Label>
            <Input
              id="acm-document"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileUpload(file, documentType);
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

export default AcmDocumentUploader;