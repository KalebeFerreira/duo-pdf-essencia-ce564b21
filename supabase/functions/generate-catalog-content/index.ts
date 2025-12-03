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
    const { type, prompt, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = prompt;

    switch (type) {
      case 'product':
        systemPrompt = `Você é um especialista em copywriting para catálogos de produtos. 
Gere conteúdo profissional e persuasivo em português brasileiro.
Responda APENAS em formato JSON válido, sem markdown.`;
        userPrompt = `Gere informações para um produto/serviço baseado neste contexto: "${prompt}"
Retorne um JSON com: {"name": "nome do produto", "description": "descrição atrativa de 2-3 frases", "price": "preço sugerido em R$", "benefits": ["benefício 1", "benefício 2", "benefício 3"]}`;
        break;

      case 'about':
        systemPrompt = `Você é um especialista em textos institucionais e branding pessoal.
Gere conteúdo profissional e envolvente em português brasileiro.
Responda APENAS em texto puro, sem markdown.`;
        userPrompt = `Gere um texto "Sobre" para um profissional/empresa com este contexto: "${prompt}"
O texto deve ter 3-4 parágrafos, ser profissional e destacar diferenciais.`;
        break;

      case 'testimonial':
        systemPrompt = `Você é um especialista em criar depoimentos autênticos de clientes.
Gere depoimentos realistas em português brasileiro.
Responda APENAS em formato JSON válido, sem markdown, sem blocos de código.`;
        userPrompt = `Gere um depoimento fictício de cliente satisfeito para: "${prompt}"
Retorne APENAS este JSON: {"name": "Nome do Cliente", "text": "depoimento de 2-3 frases", "rating": 5}`;
        break;

      case 'testimonials':
        systemPrompt = `Você é um especialista em criar depoimentos autênticos de clientes.
Gere depoimentos realistas em português brasileiro.
Responda APENAS em formato JSON válido, sem markdown, sem blocos de código.`;
        userPrompt = `Gere 3 depoimentos fictícios de clientes satisfeitos para: "${prompt}"
Retorne APENAS um array JSON: [{"id": "uuid", "name": "Nome Cliente 1", "text": "depoimento positivo"}, {"id": "uuid2", "name": "Nome Cliente 2", "text": "depoimento positivo"}, {"id": "uuid3", "name": "Nome Cliente 3", "text": "depoimento positivo"}]`;
        break;

      case 'price_item':
        systemPrompt = `Você é um especialista em precificação de serviços.
Gere itens de tabela de preços em português brasileiro.
Responda APENAS em formato JSON válido, sem markdown.`;
        userPrompt = `Gere um item de tabela de preços para: "${prompt}"
Contexto do negócio: ${context || 'serviços gerais'}
Retorne um JSON com: {"service": "nome do serviço", "price": "preço em R$", "description": "breve descrição opcional"}`;
        break;

      default:
        systemPrompt = `Você é um assistente criativo para catálogos digitais.
Responda de forma profissional em português brasileiro.`;
    }

    console.log('Generating content for type:', type);

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Faça upgrade do seu plano.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('Generated content:', content);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-catalog-content:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
