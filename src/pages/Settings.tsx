import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, User, Palette, HelpCircle, Share2, Mail, Twitter, Instagram, MessageCircle, CreditCard, Gift, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { ReferralCard } from '@/components/ReferralCard';

const SIDEBAR_COLORS = [
  { name: 'Azul Marinho', value: '#1e3a5f' },
  { name: 'Azul Royal', value: '#1e40af' },
  { name: 'Verde Escuro', value: '#14532d' },
  { name: 'Verde Esmeralda', value: '#047857' },
  { name: 'Roxo', value: '#581c87' },
  { name: 'Violeta', value: '#6d28d9' },
  { name: 'Cinza Escuro', value: '#1f2937' },
  { name: 'Slate', value: '#334155' },
  { name: 'Rosa Escuro', value: '#831843' },
  { name: 'Vermelho Escuro', value: '#7f1d1d' },
  { name: 'Laranja Escuro', value: '#9a3412' },
  { name: 'Âmbar', value: '#92400e' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  
  const { theme, setTheme } = useTheme();
  
  const [nomeCompleto, setNomeCompleto] = useState(profile?.nome_completo || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappIntegration, setWhatsappIntegration] = useState(false);
  const [language, setLanguage] = useState('pt-BR');
  const [sidebarColor, setSidebarColor] = useState(profile?.sidebar_color || '#1e3a5f');

  useEffect(() => {
    if (profile?.sidebar_color) {
      setSidebarColor(profile.sidebar_color);
    }
    if (profile?.nome_completo) {
      setNomeCompleto(profile.nome_completo);
    }
  }, [profile]);

  const handleSidebarColorChange = (color: string) => {
    setSidebarColor(color);
    updateProfile({ sidebar_color: color });
    toast({
      title: "Cor da sidebar atualizada!",
      description: "A nova cor será aplicada imediatamente.",
    });
  };

  const handleSaveProfile = () => {
    if (!nomeCompleto.trim()) {
      toast({
        title: "Erro",
        description: "O nome completo não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    updateProfile({ nome_completo: nomeCompleto });
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  const handleUpdatePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos de senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    // Mock - implementação real virá depois
    toast({
      title: "Senha atualizada!",
      description: "Sua senha foi alterada com sucesso.",
    });
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    // Mock - implementação real virá depois
    toast({
      title: "Conta deletada",
      description: "Sua conta foi removida do sistema.",
      variant: "destructive",
    });
    signOut();
  };

  const handleShare = (platform: string) => {
    const shareUrl = "https://essenciaduopdf.com";
    toast({
      title: `Compartilhar via ${platform}`,
      description: `Link: ${shareUrl}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Seção 1: Gerenciamento de Perfil e Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gerenciamento de Perfil e Conta
              </CardTitle>
              <CardDescription>Atualize suas informações pessoais e credenciais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Perfil */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input 
                    id="nome" 
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
              </div>

              {/* Credenciais */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">Alterar Senha</h3>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <Button onClick={handleUpdatePassword}>Atualizar Senha</Button>
              </div>

              {/* Deletar Conta */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-destructive mb-2">Zona de Perigo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Deletar Conta</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá deletar permanentemente sua conta
                        e remover todos os seus dados dos nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Deletar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Assinatura e Cobrança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assinatura e Cobrança
              </CardTitle>
              <CardDescription>Gerencie seu plano, método de pagamento e cancele se necessário.</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionCard />
            </CardContent>
          </Card>

          {/* Seção 3: Programa de Indicação */}
          <ReferralCard />

          {/* Seção 4: Preferências e Aparência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preferências e Aparência
              </CardTitle>
              <CardDescription>Personalize a aparência e o comportamento do aplicativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cor da Sidebar */}
              <div className="space-y-3">
                <Label>Cor da Sidebar</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha a cor do menu lateral do aplicativo
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {SIDEBAR_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleSidebarColorChange(color.value)}
                      className={`
                        relative w-full aspect-square rounded-xl transition-all hover:scale-110
                        ${sidebarColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {sidebarColor === color.value && (
                        <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
                {/* Custom color input */}
                <div className="flex items-center gap-3 mt-4">
                  <Label className="text-sm">Cor personalizada:</Label>
                  <input
                    type="color"
                    value={sidebarColor}
                    onChange={(e) => handleSidebarColorChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={sidebarColor}
                    onChange={(e) => handleSidebarColorChange(e.target.value)}
                    className="w-28 font-mono text-sm"
                    placeholder="#1e3a5f"
                  />
                </div>
              </div>

              {/* Tema */}
              <div className="space-y-2 border-t pt-6">
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Idioma */}
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">Inglês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notificações */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber e-mails de marketing e atualizações
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 4: Suporte e Ajuda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Suporte e Ajuda
              </CardTitle>
              <CardDescription>Encontre respostas e entre em contato com o suporte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/">Central de Ajuda / FAQ</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/DOCUMENTATION.md" target="_blank">Documentação</a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:contato@essenciaduopdf.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Contato: contato@essenciaduopdf.com
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Seção 5: Compartilhamento e Redes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Compartilhamento e Redes
              </CardTitle>
              <CardDescription>Compartilhe o aplicativo e conecte-se nas redes sociais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compartilhar App */}
              <div className="space-y-3">
                <h3 className="font-semibold">Compartilhar App</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleShare('WhatsApp')}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleShare('Instagram')}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleShare('Twitter')}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Integração WhatsApp */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Integração WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar compartilhamento rápido de PDFs (Fase 5)
                  </p>
                </div>
                <Switch 
                  checked={whatsappIntegration} 
                  onCheckedChange={setWhatsappIntegration}
                />
              </div>

              {/* Redes Sociais */}
              <div className="border-t pt-6 space-y-3">
                <h3 className="font-semibold">Nossas Redes Sociais</h3>
                <div className="flex flex-col gap-2">
                  <Button variant="link" className="justify-start px-0" asChild>
                    <a href="https://instagram.com/essenciaduopdf" target="_blank" rel="noopener noreferrer">
                      <Instagram className="mr-2 h-4 w-4" />
                      Instagram
                    </a>
                  </Button>
                  <Button variant="link" className="justify-start px-0" asChild>
                    <a href="https://twitter.com/essenciaduopdf" target="_blank" rel="noopener noreferrer">
                      <Twitter className="mr-2 h-4 w-4" />
                      Twitter
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default Settings;
