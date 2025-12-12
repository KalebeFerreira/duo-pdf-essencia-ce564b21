import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import FileConverter from "@/components/FileConverter";

const ConvertFile = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Conversor de Arquivos</h1>
            <p className="text-muted-foreground mb-6">
              Converta arquivos entre PDF, Word, Excel, PowerPoint e imagens
            </p>
            
            <FileConverter />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ConvertFile;
