import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Edit, Trash2, Copy, FileDown, Loader2 } from "lucide-react";
import { useCatalogs } from "@/hooks/useCatalogs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Catalogs = () => {
  const { catalogs, isLoading, deleteCatalog, duplicateCatalog, isDeleting } = useCatalogs();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    deleteCatalog(id, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Catálogo excluído com sucesso!",
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Erro ao excluir catálogo",
          variant: "destructive",
        });
      },
    });
  };

  const handleDuplicate = (catalog: any) => {
    duplicateCatalog(catalog, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Catálogo duplicado com sucesso!",
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Erro ao duplicar catálogo",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Catálogos Digitais
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie catálogos profissionais para seus produtos e serviços
          </p>
        </div>
        <Button asChild>
          <Link to="/catalog/new">
            <Plus className="w-4 h-4 mr-2" />
            Novo Catálogo
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : catalogs && catalogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogs.map((catalog) => (
            <Card key={catalog.id} className="overflow-hidden group">
              {catalog.cover_image ? (
                <div className="h-32 overflow-hidden">
                  <img
                    src={catalog.cover_image}
                    alt={catalog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: catalog.theme_primary_color }}
                >
                  <BookOpen className="w-12 h-12 text-white/50" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{catalog.title}</CardTitle>
                <CardDescription>
                  Atualizado em{' '}
                  {format(new Date(catalog.updated_at), "dd 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>{(catalog.products as any[])?.length || 0} produtos</span>
                  <span>•</span>
                  <span>{(catalog.gallery as any[])?.length || 0} imagens</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/catalog/${catalog.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDuplicate(catalog)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir catálogo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O catálogo "{catalog.title}" será
                          permanentemente excluído.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(catalog.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum catálogo criado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro catálogo digital profissional
            </p>
            <Button asChild>
              <Link to="/catalog/new">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Catálogo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Catalogs;
