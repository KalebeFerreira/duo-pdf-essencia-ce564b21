# Essência Duo PDF - Documentação Técnica

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Design System](#design-system)
5. [Componentes](#componentes)
6. [Páginas](#páginas)
7. [Integração Futura](#integração-futura)
8. [Guia de Uso](#guia-de-uso)

---

## 🎯 Visão Geral

**Essência Duo PDF** é uma aplicação web responsiva desenvolvida para autônomos, empreendedores e criadores de conteúdo que precisam criar, editar e compartilhar PDFs profissionais de forma rápida e eficiente.

### Tecnologias Utilizadas
- **Frontend**: React 18 + TypeScript
- **Estilização**: Tailwind CSS com sistema de design tokens
- **Componentes**: shadcn/ui (Radix UI)
- **Roteamento**: React Router v6
- **Build**: Vite
- **Ícones**: Lucide React

### Modelo de Negócio - Freemium

| Plano | Preço | Limites | Recursos Principais |
|-------|-------|---------|---------------------|
| **Grátis** | R$ 0,00 | 5 PDFs/mês, 1 automação IA/dia | Download básico, comunidade |
| **Básico** | R$ 19,90/mês | 25 PDFs/mês, 5 automações/dia | WhatsApp, sem anúncios |
| **Completo** | R$ 49,90/mês | Ilimitado | IA avançada, suporte prioritário |

---

## 🏗️ Arquitetura do Sistema

```
Frontend Web (React + Tailwind)
    ↓
Design System (index.css + tailwind.config.ts)
    ↓
Componentes Reutilizáveis
    ↓
Páginas (Landing, Auth, Dashboard)
    ↓
[Futuro] Supabase (Auth + Storage + DB)
    ↓
[Futuro] Google Gemini API (IA)
```

### Princípios de Arquitetura
1. **Component-First**: Todos os elementos UI são componentes reutilizáveis
2. **Design System First**: Estilos definidos em tokens semânticos
3. **Mobile-First**: Design responsivo desde o início
4. **Type-Safe**: TypeScript em todo o código

---

## 📁 Estrutura de Pastas

```
src/
├── assets/                    # Imagens e recursos estáticos
│   ├── hero-image.jpg        # Imagem principal do hero
│   ├── feature-catalog.png   # Ícone de catálogo
│   ├── feature-edit.png      # Ícone de edição
│   └── feature-share.png     # Ícone de compartilhamento
│
├── components/               # Componentes reutilizáveis
│   ├── ui/                  # Componentes shadcn/ui
│   ├── Navbar.tsx           # Barra de navegação
│   ├── Hero.tsx             # Seção hero da landing
│   ├── Features.tsx         # Grade de recursos
│   ├── PricingCard.tsx      # Card de preços
│   ├── Footer.tsx           # Rodapé
│   └── NavLink.tsx          # Link com estado ativo
│
├── pages/                   # Páginas principais
│   ├── Index.tsx            # Landing page
│   ├── Auth.tsx             # Login/Cadastro
│   ├── Dashboard.tsx        # Dashboard do usuário
│   └── NotFound.tsx         # Página 404
│
├── hooks/                   # React hooks customizados
├── lib/                     # Utilitários e helpers
├── App.tsx                  # Componente raiz
├── index.css                # Design system global
└── main.tsx                 # Entry point
```

---

## 🎨 Design System

### Paleta de Cores (HSL)

#### Modo Claro
```css
--primary: 207 90% 54%        /* Azul vibrante */
--primary-glow: 207 90% 65%   /* Azul claro */
--secondary: 33 100% 50%       /* Laranja */
--secondary-glow: 36 100% 60% /* Laranja claro */
--background: 0 0% 100%        /* Branco */
--foreground: 210 17% 15%      /* Texto escuro */
--muted: 210 40% 96%           /* Fundo suave */
```

#### Modo Escuro
```css
--primary: 207 90% 54%         /* Azul (mantém) */
--background: 210 30% 8%       /* Quase preto */
--foreground: 210 40% 98%      /* Texto claro */
--muted: 210 25% 16%           /* Fundo escuro */
```

### Gradientes
```css
--gradient-primary: linear-gradient(135deg, azul → azul claro)
--gradient-secondary: linear-gradient(135deg, laranja → laranja claro)
--gradient-hero: linear-gradient(135deg, azul → azul escuro → laranja)
```

### Sombras
```css
--shadow-glow: 0 0 20px rgba(azul, 0.3)  /* Efeito glow nos botões */
--shadow-lg: 0 10px 15px rgba(azul, 0.2)  /* Sombra grande */
```

### Como Usar o Design System

#### ✅ CORRETO
```tsx
// Use classes do sistema
<Button className="bg-gradient-primary shadow-glow">
  Começar
</Button>

// Use tokens semânticos
<div className="bg-background text-foreground border-border">
  Conteúdo
</div>
```

#### ❌ ERRADO
```tsx
// Nunca use cores diretas
<Button className="bg-blue-500 text-white">
  Começar
</Button>

// Nunca use estilos inline
<div style={{ backgroundColor: '#2196F3' }}>
  Conteúdo
</div>
```

---

## 🧩 Componentes

### Navbar
**Caminho**: `src/components/Navbar.tsx`

Barra de navegação responsiva com menu mobile.

**Props**: Nenhuma

**Características**:
- Menu hamburger em mobile
- Links para Features, Planos, Auth
- Logo com gradiente
- Botão CTA destacado

**Uso**:
```tsx
import Navbar from "@/components/Navbar";

<Navbar />
```

---

### Hero
**Caminho**: `src/components/Hero.tsx`

Seção principal da landing page.

**Props**: Nenhuma

**Características**:
- Gradiente de fundo
- Imagem hero importada
- 2 CTAs (primário e secundário)
- Estatísticas (5+ PDFs, <30s, 100% responsivo)
- Efeitos de hover nos botões

**Uso**:
```tsx
import Hero from "@/components/Hero";

<Hero />
```

---

### Features
**Caminho**: `src/components/Features.tsx`

Grade de recursos do produto.

**Props**: Nenhuma

**Características**:
- 6 cards de recursos
- Ícones Lucide
- Imagens de features
- Gradientes únicos por card
- Efeito hover com elevação

**Estrutura**:
```tsx
const features = [
  {
    icon: Wand2,
    image: featureCatalog,
    title: "Automação com IA",
    description: "...",
    gradient: "from-primary to-primary-glow"
  },
  // ...
];
```

---

### PricingCard
**Caminho**: `src/components/PricingCard.tsx`

Card de preço individual.

**Props**:
```typescript
interface PricingCardProps {
  plan: "free" | "basic" | "complete";
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}
```

**Características**:
- Badge "Mais Popular" para plano destacado
- Ícones dinâmicos (Zap, Sparkles, Crown)
- Lista de recursos com checkmarks
- CTA contextual

**Uso**:
```tsx
<PricingCard
  plan="basic"
  title="Básico"
  price="R$ 19,90"
  description="Para uso regular"
  features={["25 PDFs por mês", "5 automações/dia", ...]}
  highlighted
/>
```

---

### Footer
**Caminho**: `src/components/Footer.tsx`

Rodapé completo do site.

**Props**: Nenhuma

**Características**:
- 4 colunas de links
- Redes sociais
- Copyright dinâmico
- Links organizados (Produto, Suporte, Legal)

---

## 📄 Páginas

### Index (Landing Page)
**Caminho**: `src/pages/Index.tsx`

Página inicial pública.

**Seções**:
1. Navbar
2. Hero
3. Features
4. Pricing (inline)
5. Footer

**Rota**: `/`

---

### Auth (Autenticação)
**Caminho**: `src/pages/Auth.tsx`

Página de login e cadastro.

**Características**:
- Tabs para Login/Signup
- Formulários validados
- Link de recuperação de senha
- Gradiente de fundo
- Estado de loading

**Rota**: `/auth`

**Campos de Login**:
- E-mail
- Senha

**Campos de Cadastro**:
- Nome completo
- E-mail
- Senha
- Confirmar senha

---

### Dashboard
**Caminho**: `src/pages/Dashboard.tsx`

Painel do usuário autenticado.

**Características**:
- Header com logout
- Cards de estatísticas (PDFs usados, automações)
- Badge de plano atual
- Quick actions (Criar PDF, Automação IA)
- Lista de documentos recentes

**Rota**: `/dashboard`

**Estado**:
```typescript
const [pdfsUsed] = useState(2);
const [pdfsLimit] = useState(5);
const [automationsUsed] = useState(0);
```

---

## 🔌 Integração Futura

### Supabase (Backend)

#### 1. Autenticação
```typescript
// supabase/auth.ts
import { supabase } from './client';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};
```

#### 2. Tabelas de Banco de Dados

**Tabela: profiles**
```sql
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  plan text default 'free',
  pdfs_used int default 0,
  pdfs_limit int default 5,
  automations_used int default 0,
  created_at timestamp default now()
);
```

**Tabela: documents**
```sql
create table documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  title text,
  file_url text,
  file_size int,
  created_at timestamp default now()
);
```

#### 3. Storage Buckets
```sql
-- Bucket para PDFs dos usuários
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false);

-- RLS Policies
create policy "Users can upload own PDFs"
on storage.objects for insert
with check (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

### Google Gemini API (IA)

#### Edge Function: generate-catalog
```typescript
// supabase/functions/generate-catalog/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { images, texts, type } = await req.json();
  
  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Crie um layout de ${type} profissional com as seguintes informações: ${texts}`
        }]
      }]
    })
  });
  
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 📖 Guia de Uso

### Para Desenvolvedores

#### 1. Instalação
```bash
# Clone o repositório
git clone <repo-url>

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

#### 2. Adicionar Novo Componente
```bash
# Criar arquivo do componente
touch src/components/MeuComponente.tsx
```

```tsx
// src/components/MeuComponente.tsx
import { Button } from "@/components/ui/button";

interface MeuComponenteProps {
  title: string;
}

const MeuComponente = ({ title }: MeuComponenteProps) => {
  return (
    <div className="p-4 bg-card rounded-lg">
      <h2 className="text-foreground font-bold">{title}</h2>
      <Button className="bg-gradient-primary">
        Ação
      </Button>
    </div>
  );
};

export default MeuComponente;
```

#### 3. Adicionar Nova Página
```tsx
// src/pages/MinhaPage.tsx
const MinhaPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <h1 className="text-foreground">Minha Página</h1>
    </div>
  );
};

export default MinhaPage;
```

```tsx
// src/App.tsx
import MinhaPage from "./pages/MinhaPage";

// Adicionar rota
<Route path="/minha-page" element={<MinhaPage />} />
```

#### 4. Customizar Design System
```css
/* src/index.css */
:root {
  /* Adicionar nova cor */
  --tertiary: 150 80% 45%;
  --tertiary-foreground: 0 0% 100%;
  
  /* Adicionar novo gradiente */
  --gradient-tertiary: linear-gradient(135deg, 
    hsl(var(--tertiary)), 
    hsl(var(--primary))
  );
}
```

```typescript
// tailwind.config.ts
extend: {
  colors: {
    tertiary: {
      DEFAULT: "hsl(var(--tertiary))",
      foreground: "hsl(var(--tertiary-foreground))",
    }
  },
  backgroundImage: {
    "gradient-tertiary": "var(--gradient-tertiary)",
  }
}
```

---

### Para Usuários

#### 1. Criar Conta
1. Acesse `/auth`
2. Clique em "Criar Conta"
3. Preencha nome, e-mail e senha
4. Clique em "Criar Conta Grátis"

#### 2. Fazer Login
1. Acesse `/auth`
2. Aba "Entrar"
3. Digite e-mail e senha
4. Clique em "Entrar"

#### 3. Criar PDF (Futuro)
1. No Dashboard, clique em "Criar PDF"
2. Faça upload de imagens ou adicione texto
3. Clique em "Gerar PDF"
4. Download ou compartilhe via WhatsApp

#### 4. Usar Automação IA (Futuro)
1. Clique em "Automação com IA"
2. Selecione tipo (Catálogo, Cardápio, Orçamento)
3. Adicione informações
4. IA gera layout automático
5. Edite se necessário
6. Exporte

---

## 🔧 Troubleshooting

### Problema: Cores não aparecem
**Solução**: Verifique se está usando `hsl(var(--cor))` no Tailwind e se a cor está definida em `index.css`.

### Problema: Imagem não carrega
**Solução**: Use importação ES6:
```tsx
import minhaImagem from "@/assets/imagem.jpg";
<img src={minhaImagem} alt="..." />
```

### Problema: Rota 404
**Solução**: Verifique se a rota está registrada em `App.tsx` ANTES da rota `*`.

---

## 📝 Próximos Passos

### Fase 1: Backend (Supabase)
- [ ] Configurar projeto Supabase
- [ ] Implementar autenticação real
- [ ] Criar tabelas de banco de dados
- [ ] Configurar Storage para PDFs

### Fase 2: Funcionalidade Core
- [ ] Upload de imagens
- [ ] Conversão para PDF
- [ ] Editor de PDF básico
- [ ] Gerenciador de documentos

### Fase 3: IA
- [ ] Integrar Google Gemini API
- [ ] Criar edge function de automação
- [ ] Implementar geração de catálogos
- [ ] Implementar geração de cardápios

### Fase 4: Monetização
- [ ] Integrar Stripe para pagamentos
- [ ] Sistema de planos e limites
- [ ] Dashboard de assinatura
- [ ] Sistema de anúncios (plano grátis)

### Fase 5: Compartilhamento
- [ ] Integração WhatsApp Web
- [ ] Sistema de links compartilháveis
- [ ] Exportação em múltiplos formatos

---

## 📞 Suporte

Para dúvidas técnicas ou suporte:
- E-mail: dev@essenciaduopdf.com
- Documentação: [Link futuro]
- Comunidade: [Discord/Slack futuro]

---

**Última atualização**: 11 de novembro de 2025  
**Versão**: 1.0.0  
**Licença**: Proprietária