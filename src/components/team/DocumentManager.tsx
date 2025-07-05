
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Trash2 } from "lucide-react";

interface TeamDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  data?: string;
}

interface DocumentManagerProps {
  documents: TeamDocument[];
  onDeleteDocument: (documentId: string) => void;
  onDownloadDocument: (document: TeamDocument) => void;
  showDocuments: boolean;
  onClose: () => void;
  memberName: string;
}

const DocumentManager = ({ 
  documents, 
  onDeleteDocument, 
  onDownloadDocument, 
  showDocuments, 
  onClose,
  memberName 
}: DocumentManagerProps) => {
  return (
    <Dialog open={showDocuments} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documents</DialogTitle>
          <DialogDescription>
            Documents de {memberName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {documents.length > 0 ? documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-500">
                    Ajouté le {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadDocument(doc)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Télécharger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteDocument(doc.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucun document</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentManager;
