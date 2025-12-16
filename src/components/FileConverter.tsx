import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileType, Download, Loader2, ArrowRight, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDocuments } from "@/hooks/useDocuments";
import { Link } from "react-router-dom";

const SUPPORTED_CONVERSIONS = {
  // Images to PDF
  jpg: ['pdf', 'png', 'webp'],
  jpeg: ['pdf', 'png', 'webp'],
  png: ['pdf', 'jpg', 'webp'],
  webp: ['pdf', 'jpg', 'png'],
  // Documents to PDF
  doc: ['pdf', 'docx', 'txt'],
  docx: ['pdf', 'doc', 'txt'],
  xls: ['pdf', 'xlsx', 'csv'],
  xlsx: ['pdf', 'xls', 'csv'],
  ppt: ['pdf', 'pptx'],
  pptx: ['pdf', 'ppt'],
  // PDF to other formats
  pdf: ['docx', 'xlsx', 'pptx', 'jpg', 'png', 'txt'],
  // Text
  txt: ['pdf', 'docx'],
  csv: ['pdf', 'xlsx'],
};

const FORMAT_LABELS: Record<string, string> = {
  pdf: 'PDF',
  jpg: 'JPG (Imagem)',
  jpeg: 'JPEG (Imagem)',
  png: 'PNG (Imagem)',
  webp: 'WebP (Imagem)',
  doc: 'Word (DOC)',
  docx: 'Word (DOCX)',
  xls: 'Excel (XLS)',
  xlsx: 'Excel (XLSX)',
  ppt: 'PowerPoint (PPT)',
  pptx: 'PowerPoint (PPTX)',
  txt: 'Texto (TXT)',
  csv: 'CSV',
};

const MONTHLY_CONVERSION_LIMIT_FREE = 5;
const MONTHLY_CONVERSION_LIMIT_BASIC = 100;

interface FileConverterProps {
  onConversionComplete?: () => void;
}

const FileConverter = ({ onConversionComplete }: FileConverterProps) => {
  const { profile } = useUserProfile();
  const { documents } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>("");

  // Check user plan
  const userPlan = profile?.plan || 'free';
  const isFreePlan = userPlan === 'free';
  const isBasicPlan = userPlan === 'basic';
  const isProfessionalPlan = userPlan === 'professional';
  
  // Count conversions this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const conversionsThisMonth = documents?.filter(doc => {
    const docDate = new Date(doc.created_at || '');
    return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
  }).length || 0;
  
  // Free: 5/month, Basic: 100/month, Professional: unlimited
  const monthlyLimit = isFreePlan ? MONTHLY_CONVERSION_LIMIT_FREE : MONTHLY_CONVERSION_LIMIT_BASIC;
  const remainingConversions = isFreePlan || isBasicPlan ? Math.max(0, monthlyLimit - conversionsThisMonth) : 0;
  const hasReachedLimit = (isFreePlan || isBasicPlan) && conversionsThisMonth >= monthlyLimit;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!SUPPORTED_CONVERSIONS[extension as keyof typeof SUPPORTED_CONVERSIONS]) {
      toast({
        title: "Formato não suportado",
        description: "Este tipo de arquivo não é suportado para conversão.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setInputFormat(extension);
    setOutputFormat("");
    setDownloadUrl(null);
    setOutputFileName("");
  };

  const handleConvert = async () => {
    if (!selectedFile || !outputFormat) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e o formato de saída.",
        variant: "destructive",
      });
      return;
    }

    if (hasReachedLimit) {
      const limitMsg = isFreePlan 
        ? `Você atingiu o limite de ${MONTHLY_CONVERSION_LIMIT_FREE} conversões do plano gratuito.`
        : `Você atingiu o limite de ${MONTHLY_CONVERSION_LIMIT_BASIC} conversões por mês.`;
      toast({
        title: "Limite Mensal Atingido",
        description: `${limitMsg} Faça upgrade para mais conversões.`,
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    setProgress(10);

    try {
      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setProgress(30);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('convert-file', {
        body: {
          fileName: selectedFile.name,
          fileBase64,
          inputFormat,
          outputFormat,
        },
      });

      setProgress(80);

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setDownloadUrl(data.downloadUrl);
      setOutputFileName(data.outputFileName);
      setProgress(100);

      toast({
        title: "Conversão concluída!",
        description: `Arquivo convertido para ${FORMAT_LABELS[outputFormat] || outputFormat.toUpperCase()}.`,
      });

      onConversionComplete?.();

    } catch (error: any) {
      console.error('Conversion error:', error);
      toast({
        title: "Erro na conversão",
        description: error.message || "Ocorreu um erro ao converter o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = outputFileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const availableOutputFormats = inputFormat 
    ? SUPPORTED_CONVERSIONS[inputFormat as keyof typeof SUPPORTED_CONVERSIONS] || []
    : [];

  const resetForm = () => {
    setSelectedFile(null);
    setInputFormat("");
    setOutputFormat("");
    setDownloadUrl(null);
    setOutputFileName("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Free plan: limit indicator */}
      {isFreePlan && (
        <Card className={`border ${hasReachedLimit ? 'border-destructive bg-destructive/5' : 'border-blue-500/50 bg-blue-500/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {hasReachedLimit ? (
                  <Lock className="w-5 h-5 text-destructive" />
                ) : (
                  <FileType className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {hasReachedLimit 
                      ? "Limite Mensal Atingido" 
                      : `${remainingConversions} de ${MONTHLY_CONVERSION_LIMIT_FREE} conversões restantes`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasReachedLimit 
                      ? "Faça upgrade para mais conversões"
                      : "Plano Gratuito - limite mensal de conversões"
                    }
                  </p>
                </div>
              </div>
              <Link to="/pricing">
                <Button size="sm">{hasReachedLimit ? 'Fazer Upgrade' : 'Ver Planos'}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic plan: limit indicator */}
      {isBasicPlan && (
        <Card className={`border ${hasReachedLimit ? 'border-destructive bg-destructive/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {hasReachedLimit ? (
                  <Lock className="w-5 h-5 text-destructive" />
                ) : (
                  <FileType className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {hasReachedLimit 
                      ? "Limite Mensal Atingido" 
                      : `${remainingConversions} de ${MONTHLY_CONVERSION_LIMIT_BASIC} conversões restantes`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasReachedLimit 
                      ? "Faça upgrade para o plano Profissional para conversões ilimitadas"
                      : "Plano Básico - limite mensal de conversões"
                    }
                  </p>
                </div>
              </div>
              {hasReachedLimit && (
                <Link to="/pricing">
                  <Button size="sm">Upgrade Profissional</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional plan: unlimited indicator */}
      {isProfessionalPlan && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">Conversões Ilimitadas</p>
                <p className="text-xs text-muted-foreground">Plano Profissional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileType className="w-5 h-5" />
            Conversor de Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Selecionar Arquivo</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                hasReachedLimit 
                  ? 'border-muted bg-muted/20 cursor-not-allowed' 
                  : 'border-border hover:border-primary'
              }`}
              onClick={() => !hasReachedLimit && fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {FORMAT_LABELS[inputFormat] || inputFormat.toUpperCase()}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {hasReachedLimit ? "Limite de conversões atingido" : "Clique para selecionar um arquivo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, PowerPoint, Imagens (JPG, PNG, WebP)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={hasReachedLimit}
              />
            </div>
          </div>

          {/* Format Selection */}
          {selectedFile && (
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label>Formato de Entrada</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
                  {FORMAT_LABELS[inputFormat] || inputFormat.toUpperCase()}
                </div>
              </div>
              
              <ArrowRight className="w-5 h-5 text-muted-foreground mt-6" />
              
              <div className="flex-1 space-y-2">
                <Label>Converter Para</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOutputFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {FORMAT_LABELS[format] || format.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Progress */}
          {isConverting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Convertendo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Download Result */}
          {downloadUrl && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium">Conversão concluída!</p>
                      <p className="text-sm text-muted-foreground">{outputFileName}</p>
                    </div>
                  </div>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {downloadUrl ? (
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Nova Conversão
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleConvert}
                  disabled={!selectedFile || !outputFormat || isConverting || hasReachedLimit}
                  className="flex-1"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Convertendo...
                    </>
                  ) : (
                    <>
                      <FileType className="w-4 h-4 mr-2" />
                      Converter Arquivo
                    </>
                  )}
                </Button>
                {selectedFile && (
                  <Button onClick={resetForm} variant="outline">
                    Limpar
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Supported Formats Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Formatos suportados:</p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(SUPPORTED_CONVERSIONS).map((format) => (
                <span 
                  key={format} 
                  className="px-2 py-0.5 bg-muted rounded text-xs"
                >
                  {format.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileConverter;
