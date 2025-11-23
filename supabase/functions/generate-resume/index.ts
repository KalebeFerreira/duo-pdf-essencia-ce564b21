import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, template } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    // Construir prompt otimizado para geração de currículo
    const systemPrompt = `Você é um especialista em recursos humanos e criação de currículos profissionais. 
Sua tarefa é gerar um currículo completo, profissional e otimizado para ATS (Applicant Tracking Systems).

IMPORTANTE:
- Use palavras-chave relevantes para a área de atuação
- Estruture o conteúdo de forma clara e profissional
- Otimize para sistemas de rastreamento de candidatos
- Use verbos de ação e resultados quantificáveis quando possível
- Mantenha tom profissional e objetivo
- Adapte o estilo ao template escolhido: ${template}`;

    const photoSection = formData.photoUrl 
      ? `\n\n[FOTO PROFISSIONAL: ${formData.photoUrl}]\n` 
      : '';

    const userPrompt = `Gere um currículo profissional completo baseado nas seguintes informações:${photoSection}

Nome: ${formData.fullName}
Profissão: ${formData.profession}
Email: ${formData.email || 'Não informado'}
Telefone: ${formData.phone || 'Não informado'}

${formData.summary ? `Resumo fornecido: ${formData.summary}` : 'Gere um resumo profissional impactante (3-4 linhas)'}

${formData.experience ? `Experiência fornecida: ${formData.experience}` : 'Gere experiências profissionais relevantes e realistas para a área (2-3 cargos)'}

${formData.education ? `Formação fornecida: ${formData.education}` : 'Gere formação acadêmica apropriada para a área'}

${formData.skills ? `Habilidades fornecidas: ${formData.skills}` : 'Gere habilidades técnicas e comportamentais relevantes (8-10 habilidades)'}

Template escolhido: ${template.toUpperCase()}

FORMATO DE SAÍDA:
Retorne o currículo em formato de texto limpo e estruturado, com seções bem definidas:

[NOME COMPLETO]
[PROFISSÃO]
[EMAIL] | [TELEFONE]

RESUMO PROFISSIONAL
[3-4 linhas impactantes destacando experiência e valor]

EXPERIÊNCIA PROFISSIONAL
[Cargo mais recente] - [Empresa] | [Período]
• [Realização com resultado quantificável]
• [Responsabilidade importante]
• [Conquista relevante]

[Cargo anterior] - [Empresa] | [Período]
• [Realização]
• [Responsabilidade]

FORMAÇÃO ACADÊMICA
[Grau] em [Curso] - [Instituição] | [Ano]
[Certificações relevantes]

HABILIDADES
• [Habilidade 1] • [Habilidade 2] • [Habilidade 3]
• [Habilidade 4] • [Habilidade 5] • [Habilidade 6]

IDIOMAS (se relevante)
[Idioma] - [Nível]

INFORMAÇÕES ADICIONAIS (se relevante)
[Projetos, publicações, prêmios]`;

    console.log('Calling Lovable AI to generate resume...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      
      throw new Error('Failed to generate resume with AI');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Resume generated successfully');

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        template: template,
        photoUrl: formData.photoUrl || null,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-resume function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
