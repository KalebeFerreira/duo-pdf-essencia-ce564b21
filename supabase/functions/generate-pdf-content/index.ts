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
    const { prompt, topic } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating PDF content for topic:', topic);

    const systemPrompt = `Você é um assistente especializado em gerar conteúdo profissional e detalhado.
    
O conteúdo deve incluir:
- Uma introdução clara e envolvente
- Pontos principais bem estruturados
- Exemplos práticos quando aplicável
- Uma conclusão resumindo os pontos chave

Formato: Estruture o conteúdo de forma que possa ser facilmente convertido em PDF.`;

    const userPrompt = prompt || `Gere um conteúdo profissional e detalhado sobre: ${topic}`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '';

    console.log('Content generated successfully');

    // Identificar seções do conteúdo para gerar imagens específicas
    let enrichedContent = generatedContent;
    
    try {
      console.log('Analyzing content sections...');
      
      // Extrair seções principais do conteúdo (linhas que começam com ## ou ###)
      const sections = generatedContent.split('\n').filter((line: string) => 
        line.trim().startsWith('##') && !line.trim().startsWith('###')
      );
      
      console.log(`Found ${sections.length} main sections`);
      
      if (sections.length > 0) {
        // Gerar uma imagem para cada seção (máximo 4)
        const sectionsToImage = sections.slice(0, 4);
        
        for (let i = 0; i < sectionsToImage.length; i++) {
          const sectionTitle = sectionsToImage[i].replace(/^#+\s*/, '').trim();
          console.log(`Generating image for section: ${sectionTitle}`);
          
          try {
            // Criar prompt específico para a seção
            const imagePrompt = `Professional high-quality image about "${sectionTitle}" related to ${topic}. Corporate style, modern, professional people or business environment, bright natural lighting, realistic photo`;
            
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
              const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              
              if (imageUrl) {
                console.log(`Image generated for section: ${sectionTitle}`);
                
                // Inserir a imagem logo após o título da seção
                const sectionHeader = sectionsToImage[i];
                enrichedContent = enrichedContent.replace(
                  sectionHeader,
                  `${sectionHeader}\n\n![${sectionTitle}](${imageUrl})\n`
                );
              }
            }
          } catch (imgError) {
            console.error(`Error generating image for section ${sectionTitle}:`, imgError);
            // Continue para a próxima seção
          }
        }
      } else {
        // Se não houver seções, gerar 2 imagens gerais
        console.log('No sections found, generating general images');
        
        const generalPrompts = [
          `Professional stock photo related to ${topic}, high quality, corporate style, bright lighting, business people`,
          `Modern professional illustration about ${topic}, clean design, vibrant colors, business concept`
        ];

        for (const imagePrompt of generalPrompts) {
          try {
            const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image-preview',
                messages: [{ role: 'user', content: imagePrompt }],
                modalities: ['image', 'text']
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (imageUrl) {
                enrichedContent += `\n\n![Image](${imageUrl})\n`;
                console.log('General image added');
              }
            }
          } catch (imgError) {
            console.error('Error generating general image:', imgError);
          }
        }
      }
    } catch (error) {
      console.error('Error in image generation process:', error);
      // Continue com o conteúdo original se houver erro
    }

    console.log('Content enrichment completed');

    return new Response(
      JSON.stringify({ 
        content: enrichedContent,
        topic: topic,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-pdf-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred generating content' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
