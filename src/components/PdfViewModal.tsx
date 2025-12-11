import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import PdfDownloadButton from "@/components/PdfDownloadButton";

interface PdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content?: string;
    created_at: string;
    photo_url?: string;
    signature_url?: string;
    template?: string;
  } | null;
}

const PdfViewModal = ({ isOpen, onClose, document }: PdfViewModalProps) => {
  if (!document) return null;

  const formattedDate = new Date(document.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">{document.title}</DialogTitle>
                <DialogDescription>Criado em {formattedDate}</DialogDescription>
              </div>
            </div>
            <PdfDownloadButton
              content={document.content || ""}
              title={document.title}
              photoUrl={document.photo_url}
              signatureUrl={document.signature_url}
              template={document.template || "modern"}
              variant="default"
              size="sm"
            />
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full rounded-md border p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {document.content ? (
              <div>
                {/* Foto do Currículo */}
                {document.photo_url && (
                  <div className="flex justify-center mb-6">
                    <img 
                      src={document.photo_url} 
                      alt="Foto profissional" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
                    />
                  </div>
                )}
                <div className="whitespace-pre-wrap text-foreground">
                  {document.content}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum conteúdo disponível para este documento.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewModal;
