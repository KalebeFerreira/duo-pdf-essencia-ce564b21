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
    "Título do Capítulo 3"
  ]
}

IMPORTANT:
- Create EXACTLY ${numPages} chapters (no more, no less)
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

    // Passo 2: Gerar múltiplas imagens para capítulos principais
    console.log('Generating images for key chapters');
    const chapterImages: string[] = [];
    
    // Gerar imagem para capa e capítulos principais (a cada 2 capítulos)
    const imagesToGenerate = Math.min(Math.ceil(ebookStructure.chapters.length / 2) + 1, 4);
    
    try {
      const imagePromises = [];
      
      // Imagem da capa
      imagePromises.push(
        fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `Create a professional, realistic cover image for "${ebookStructure.title}". 
Style: Modern, photorealistic, high-quality professional design. 
Theme: ${ebookStructure.description}
Requirements: Clean, elegant, vibrant colors, impressive visual` 
              }
            ],
            modalities: ['image', 'text']
          }),
        })
      );

      // Imagens para capítulos principais
      for (let i = 0; i < imagesToGenerate - 1; i++) {
        const chapterIndex = i * 2;
        if (chapterIndex < ebookStructure.chapters.length) {
          const chapterTitle = ebookStructure.chapters[chapterIndex];
          imagePromises.push(
            fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                    content: `Create a professional, realistic image demonstrating: "${chapterTitle}". 
Theme: ${ebookStructure.description}
Style: Modern, photorealistic, high-quality, educational, clear visual demonstration
Requirements: Professional, vibrant, illustrative, relevant to the topic` 
                  }
                ],
                modalities: ['image', 'text']
              }),
            })
          );
        }
      }

      const imageResponses = await Promise.all(imagePromises);
      
      for (const response of imageResponses) {
        if (response.ok) {
          const imageData = await response.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
          if (imageUrl) {
            chapterImages.push(imageUrl);
          }
        }
      }
      
      console.log(`Successfully generated ${chapterImages.length} images`);
    } catch (imgError) {
      console.error('Error generating images:', imgError);
    }

    // Passo 3: Gerar conteúdo REDUZIDO para cada capítulo em paralelo
    console.log('Generating concise content for all chapters in parallel...');
    
    const chapterPromises = ebookStructure.chapters.map(async (chapterTitle: string, i: number) => {
      const contentPrompt = `Write CONCISE, visual-focused content for this ebook chapter ${langInstruction}:

Ebook Title: ${ebookStructure.title}
Description: ${ebookStructure.description}
Chapter: ${chapterTitle}

CRITICAL GUIDELINES:
- MAXIMUM 300-400 words (shorter is better)
- Focus on key points and actionable insights
- Use bullet points and short paragraphs
- Write for visual learning (text complements images)
- Clear, direct language
- Practical examples in brief format
- Professional yet accessible tone
- Write ENTIRELY ${langInstruction}
- AVOID long explanations - be concise and impactful`;

      try {
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
          return {
            title: chapterTitle,
            content: 'Erro ao gerar conteúdo para este capítulo.',
            imageUrl: ''
          };
        }

        const contentData = await contentResponse.json();
        const chapterContent = contentData.choices?.[0]?.message?.content || '';

        // Distribuir imagens: capa no primeiro, depois a cada 2 capítulos
        let chapterImageUrl = '';
        if (i === 0 && chapterImages.length > 0) {
          chapterImageUrl = chapterImages[0]; // Capa
        } else if (i % 2 === 0 && chapterImages.length > Math.floor(i / 2)) {
          chapterImageUrl = chapterImages[Math.floor(i / 2) + 1]; // Imagens dos capítulos
        }

        return {
          title: chapterTitle,
          content: chapterContent,
          imageUrl: chapterImageUrl
        };
      } catch (error) {
        console.error(`Error generating chapter ${i + 1}:`, error);
        return {
          title: chapterTitle,
          content: 'Erro ao gerar conteúdo para este capítulo.',
          imageUrl: ''
        };
      }
    });

    const chaptersWithContent = await Promise.all(chapterPromises);

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