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
    const { prompt, language = 'pt', colorPalette = 'classic' } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Starting complete ebook generation from prompt:', prompt, 'language:', language);

    const languageInstructions: Record<string, string> = {
      pt: 'em Português do Brasil',
      en: 'in English',
      es: 'en Español',
      fr: 'en Français',
      de: 'auf Deutsch',
      it: 'in Italiano',
    };

    const langInstruction = languageInstructions[language] || languageInstructions['pt'];

    // Passo 1: Gerar estrutura do ebook (título, descrição, capítulos)
    const structurePrompt = `You are an expert in creating high-quality ebooks.

Based on the user's prompt, create a complete ebook structure ${langInstruction}.

USER PROMPT: "${prompt}"

Return ONLY a valid JSON (no markdown, no explanations) with this structure:
{
  "title": "Título cativante do ebook (máximo 60 caracteres)",
  "description": "Descrição profissional e envolvente do ebook (2-3 linhas)",
  "chapters": [
    "Título do Capítulo 1",
    "Título do Capítulo 2",
    "Título do Capítulo 3",
    "Título do Capítulo 4",
    "Título do Capítulo 5"
  ]
}

IMPORTANT:
- Create 5-8 chapters
- Titles must be specific and progressive
- Structure must be logically coherent
- ALL CONTENT must be ${langInstruction}
- Return ONLY the JSON, no additional text`;

    const structureResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: structurePrompt }
        ],
      }),
    });

    if (!structureResponse.ok) {
      const errorText = await structureResponse.text();
      console.error('Structure generation error:', structureResponse.status, errorText);
      
      if (structureResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Créditos de IA esgotados',
            message: 'Seus créditos do Lovable AI acabaram. Adicione créditos em Settings → Workspace → Usage.',
            code: 'NO_CREDITS'
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error('Failed to generate ebook structure');
    }

    const structureData = await structureResponse.json();
    const structureContent = structureData.choices?.[0]?.message?.content || '';
    
    // Limpar o JSON de possíveis marcadores de markdown
    const cleanJson = structureContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const ebookStructure = JSON.parse(cleanJson);
    
    console.log('Ebook structure generated:', ebookStructure);

    // Passo 2: Gerar conteúdo para cada capítulo
    const chaptersWithContent = [];
    
    for (let i = 0; i < ebookStructure.chapters.length; i++) {
      const chapterTitle = ebookStructure.chapters[i];
      console.log(`Generating content for chapter ${i + 1}/${ebookStructure.chapters.length}: ${chapterTitle}`);

      const contentPrompt = `Write complete content for this ebook chapter ${langInstruction}:

Ebook Title: ${ebookStructure.title}
Description: ${ebookStructure.description}
Chapter: ${chapterTitle}

GUIDELINES:
- Professional, informative, well-structured content
- Use clear and engaging language
- Include practical examples when relevant
- Structure with well-organized paragraphs
- 500-800 words
- Professional yet accessible tone
- Write ENTIRELY ${langInstruction}`;

      const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: contentPrompt }
          ],
        }),
      });

      if (!contentResponse.ok) {
        console.error(`Failed to generate content for chapter ${i + 1}`);
        chaptersWithContent.push({
          title: chapterTitle,
          content: 'Erro ao gerar conteúdo para este capítulo.',
          imageUrl: ''
        });
        continue;
      }

      const contentData = await contentResponse.json();
      const chapterContent = contentData.choices?.[0]?.message?.content || '';

      // Passo 3: Gerar imagem para o capítulo
      console.log(`Generating image for chapter ${i + 1}`);
      let imageUrl = '';
      
      try {
        const imagePrompt = `High-quality realistic professional photograph for a book chapter about "${chapterTitle}" in the context of "${ebookStructure.title}". 

Style requirements:
- Photorealistic, professional stock photo quality
- Professional business or educational setting
- Natural lighting, high resolution
- Modern and clean aesthetic
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
              { role: 'user', content: imagePrompt }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
        }
      } catch (imgError) {
        console.error(`Error generating image for chapter ${i + 1}:`, imgError);
      }

      chaptersWithContent.push({
        title: chapterTitle,
        content: chapterContent,
        imageUrl: imageUrl
      });
    }

    console.log('Complete ebook generation finished');

    return new Response(
      JSON.stringify({ 
        title: ebookStructure.title,
        description: ebookStructure.description,
        chapters: chaptersWithContent,
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