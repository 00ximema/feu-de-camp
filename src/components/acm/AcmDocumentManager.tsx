import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Trash2 } from "lucide-react";

export interface AcmDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  data?: string;
  documentType: string;
}

interface AcmDocumentManagerProps {
  documents: AcmDocument[];
  onDeleteDocument: (documentId: string) => void;
  onDownloadDocument: (document: AcmDocument) => void;
  showDocuments: boolean;
  onClose: () => void;
  documentType: string;
  documentLabel: string;
}

const AcmDocumentManager = ({ 
  documents, 
  onDeleteDocument, 
  onDownloadDocument, 
  showDocuments, 
  onClose,
  documentType,
  documentLabel 
}: AcmDocumentManagerProps) => {
  const filteredDocuments = documents.filter(doc => doc.documentType === documentType);

  return (
    <Dialog open={showDocuments} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documents</DialogTitle>
          <DialogDescription>
            Documents pour : {documentLabel}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {filteredDocuments.length > 0 ? filteredDocuments.map((doc) => (
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
              <p className="text-gray-500">Aucun document pour ce type</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcmDocumentManager;