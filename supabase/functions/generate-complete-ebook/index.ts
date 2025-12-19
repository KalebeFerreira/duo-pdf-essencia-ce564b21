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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Starting ebook generation:', { prompt: prompt.substring(0, 100), language, numPages });
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

    // PASSO 1: Gerar estrutura + conteúdo com OpenAI (rápido)
    console.log('Step 1: Generating content with OpenAI...');
    
    const fullPrompt = `You are an expert ebook writer. Create a complete, high-quality ebook about: "${prompt}"

Write entirely in ${langName}.

Return ONLY valid JSON with this exact structure:
{
  "title": "Compelling title (max 60 chars)",
  "description": "Professional 2-3 sentence description",
  "chapters": [
    {
      "title": "Chapter 1 Title",
      "content": "Full chapter content with 400-500 words, well-structured with paragraphs, bullet points, and practical examples",
      "imagePrompt": "Detailed description for generating a professional illustration for this chapter"
    }
  ]
}

REQUIREMENTS:
- Generate exactly ${numPages} chapters
- Each chapter: 400-500 words of rich, valuable content
- Each chapter must have an "imagePrompt" field describing a relevant professional image
- Use engaging, professional writing style
- Include practical tips, examples, and actionable insights
- Write EVERYTHING in ${langName}
- Return ONLY the JSON, no markdown or extra text`;

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
            content: `You are a professional ebook writer. Write high-quality, engaging content in ${langName}.`
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
          JSON.stringify({ error: 'Rate limit exceeded', message: 'Aguarde e tente novamente.', code: 'RATE_LIMIT' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate ebook content');
    }

    const contentData = await contentResponse.json();
    const rawContent = contentData.choices?.[0]?.message?.content || '';
    
    let ebook;
    try {
      let cleanedText = rawContent.trim();
      if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
      if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
      if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
      ebook = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('Failed to parse ebook JSON:', parseError);
      throw new Error('Failed to parse ebook structure');
    }

    const contentTime = Date.now();
    console.log(`Content generated in ${contentTime - startTime}ms`);

    // PASSO 2: Gerar imagens com Gemini/Lovable AI em paralelo
    console.log('Step 2: Generating images with Gemini...');
    
    const generateImage = async (prompt: string, index: number): Promise<string> => {
      try {
        console.log(`Generating image ${index}...`);
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: prompt
              }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Image ${index} generation failed:`, response.status, errorText);
          return '';
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
        
        if (imageUrl) {
          console.log(`Image ${index} generated successfully`);
        } else {
          console.log(`Image ${index} - no image URL in response`);
        }
        
        return imageUrl;
      } catch (error) {
        console.error(`Image ${index} error:`, error);
        return '';
      }
    };

    // Gerar imagem de capa + imagens dos capítulos
    const coverPrompt = `Create a professional, modern ebook cover image for: "${ebook.title}". 
Style: Clean, elegant, professional book cover design with vibrant colors. 
Theme: ${ebook.description}
Requirements: High-quality, visually impressive, suitable for a digital ebook cover.`;

    const imagePromises = [
      generateImage(coverPrompt, 0), // Capa
      ...ebook.chapters.map((ch: any, idx: number) => 
        generateImage(
          ch.imagePrompt || `Professional illustration for: "${ch.title}". Modern, educational, high-quality visual.`,
          idx + 1
        )
      )
    ];

    const images = await Promise.all(imagePromises);
    
    const imageTime = Date.now();
    const successfulImages = images.filter(Boolean).length;
    console.log(`Images generated in ${imageTime - contentTime}ms. Success: ${successfulImages}/${images.length}`);

    // Montar capítulos com imagens
    const chaptersWithImages = ebook.chapters.map((chapter: any, idx: number) => ({
      title: chapter.title,
      content: chapter.content,
      imageUrl: images[idx + 1] || '' // +1 porque índice 0 é a capa
    }));

    const totalTime = Date.now() - startTime;
    console.log(`Total generation time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({ 
        title: ebook.title,
        description: ebook.description,
        chapters: chaptersWithImages,
        coverImage: images[0] || '',
        processingTime: totalTime,
        imagesGenerated: successfulImages,
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
