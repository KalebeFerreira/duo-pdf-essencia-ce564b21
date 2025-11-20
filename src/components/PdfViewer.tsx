import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const PdfViewer = ({ isOpen, onClose, title, content }: PdfViewerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Visualização do conteúdo do documento
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap">{content}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewer;
