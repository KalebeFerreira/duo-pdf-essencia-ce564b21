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
    const { prompt, language = 'pt', colorPalette = 'classic', numPages = 5 } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Starting optimized ebook generation:', { prompt, language, numPages });
    const startTime = Date.now();

    const languageNames: Record<string, string> = {
      pt: 'Brazilian Portuguese',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
    };

    const langName = languageNames[language] || 'Brazilian Portuguese';

    // PASSO ÚNICO: Gerar estrutura + todo o conteúdo em uma chamada só
    const fullPrompt = `You are an expert ebook writer. Create a complete, high-quality ebook about: "${prompt}"

Write entirely in ${langName}.

Return ONLY valid JSON with this exact structure:
{
  "title": "Compelling title (max 60 chars)",
  "description": "Professional 2-3 sentence description",
  "chapters": [
    {
      "title": "Chapter 1 Title",
      "content": "Full chapter content with 400-500 words, well-structured with paragraphs, bullet points, and practical examples"
    }
  ]
}

REQUIREMENTS:
- Generate exactly ${numPages} chapters
- Each chapter: 400-500 words of rich, valuable content
- Use engaging, professional writing style
- Include practical tips, examples, and actionable insights
- Structure content with clear paragraphs
- Make content educational and transformative
- Write EVERYTHING in ${langName}
- Return ONLY the JSON, no markdown or extra text`;

    // Gerar conteúdo completo com OpenAI (muito mais rápido que múltiplas chamadas)
    const contentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a professional ebook writer. Write high-quality, engaging content in ${langName}. Be creative and informative.`
          },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('OpenAI content error:', contentResponse.status, errorText);
      
      if (contentResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            message: 'Muitas requisições. Aguarde um momento e tente novamente.',
            code: 'RATE_LIMIT'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate ebook content');
    }

    const contentData = await contentResponse.json();
    const rawContent = contentData.choices?.[0]?.message?.content || '';
    
    // Parse JSON do conteúdo
    let ebook;
    try {
      let cleanedText = rawContent.trim();
      if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
      if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
      if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
      ebook = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('Failed to parse ebook JSON:', parseError);
      console.log('Raw content:', rawContent);
      throw new Error('Failed to parse ebook structure');
    }

    const contentTime = Date.now();
    console.log(`Content generated in ${contentTime - startTime}ms`);

    // GERAR IMAGENS EM PARALELO usando OpenAI gpt-image-1
    console.log('Generating images with OpenAI gpt-image-1...');
    
    const imagePrompts = [
      // Capa
      `Professional ebook cover design for "${ebook.title}". Modern, clean, vibrant colors, professional typography placeholder, elegant visual design. High quality book cover.`,
      // Imagens dos capítulos
      ...ebook.chapters.map((ch: any) => 
        `Professional illustration for chapter: "${ch.title}". Educational, clean, modern style, relevant visual representation of the topic. High quality.`
      )
    ];

    const imagePromises = imagePrompts.map(async (imgPrompt, idx) => {
      try {
        const imgResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: imgPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'medium',
          }),
        });

        if (!imgResponse.ok) {
          console.error(`Image ${idx} generation failed:`, imgResponse.status);
          return null;
        }

        const imgData = await imgResponse.json();
        // gpt-image-1 retorna b64_json por padrão
        const b64 = imgData.data?.[0]?.b64_json;
        if (b64) {
          return `data:image/png;base64,${b64}`;
        }
        return imgData.data?.[0]?.url || null;
      } catch (imgError) {
        console.error(`Image ${idx} error:`, imgError);
        return null;
      }
    });

    const images = await Promise.all(imagePromises);
    const imageTime = Date.now();
    console.log(`Images generated in ${imageTime - contentTime}ms. Got ${images.filter(Boolean).length}/${images.length} images`);

    // Montar capítulos com imagens
    const chaptersWithImages = ebook.chapters.map((chapter: any, idx: number) => ({
      title: chapter.title,
      content: chapter.content,
      imageUrl: images[idx + 1] || '' // +1 porque índice 0 é a capa
    }));

    // Adicionar imagem de capa ao primeiro capítulo se existir
    if (images[0] && chaptersWithImages.length > 0) {
      chaptersWithImages[0].coverImage = images[0];
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total ebook generation time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({ 
        title: ebook.title,
        description: ebook.description,
        chapters: chaptersWithImages,
        coverImage: images[0] || '',
        processingTime: totalTime,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-complete-ebook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred generating ebook' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
