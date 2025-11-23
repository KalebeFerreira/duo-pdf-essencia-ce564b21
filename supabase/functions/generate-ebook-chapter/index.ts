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
    const { ebookTitle, chapterTitle, ebookDescription } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating chapter:', chapterTitle, 'for ebook:', ebookTitle);

    // Gerar conteúdo do capítulo
    const systemPrompt = `Você é um escritor especializado em criar conteúdo de alta qualidade para ebooks.
    
Diretrizes:
- Crie conteúdo profissional, informativo e bem estruturado
- Use uma linguagem clara e envolvente
- Inclua exemplos práticos quando relevante
- Mantenha um tom profissional mas acessível
- Estruture o conteúdo com parágrafos bem organizados
- O conteúdo deve ter entre 400-600 palavras`;

    const userPrompt = `Escreva o conteúdo completo para o seguinte capítulo de ebook:

Título do Ebook: ${ebookTitle}
${ebookDescription ? `Descrição do Ebook: ${ebookDescription}` : ''}
Título do Capítulo: ${chapterTitle}

Crie um conteúdo rico, informativo e profissional para este capítulo.`;

    // Gerar conteúdo
    const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('AI Gateway error:', contentResponse.status, errorText);
      throw new Error(`AI Gateway error: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    const generatedContent = contentData.choices?.[0]?.message?.content || '';

    console.log('Content generated, now generating image...');

    // Gerar imagem realista para o capítulo
    let imageUrl = '';
    try {
      const imagePrompt = `High-quality realistic professional photograph for a book chapter about "${chapterTitle}" in the context of "${ebookTitle}". 
      
Style requirements:
- Photorealistic, professional stock photo quality
- Professional business or educational setting
- Natural lighting, high resolution
- Modern and clean aesthetic
- Professional people or relevant objects
- Corporate or educational environment
- No text or watermarks`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
        console.log('Image generated successfully');
      } else {
        console.error('Image generation failed:', imageResponse.status);
      }
    } catch (imgError) {
      console.error('Error generating image:', imgError);
      // Continue sem imagem se houver erro
    }

    console.log('Chapter generation completed');

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        imageUrl: imageUrl,
        chapterTitle: chapterTitle,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-ebook-chapter:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred generating chapter' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
