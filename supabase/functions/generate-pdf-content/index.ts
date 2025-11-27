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
    const { prompt, topic, language = 'pt' } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating PDF content for topic:', topic, 'in language:', language);

    // Configurar prompts baseado no idioma
    const languageInstructions: Record<string, { system: string; default: string }> = {
      pt: {
        system: `Você é um assistente especializado em gerar conteúdo profissional e detalhado em português.
    
O conteúdo deve incluir:
- Uma introdução clara e envolvente
- Pontos principais bem estruturados
- Exemplos práticos quando aplicável
- Uma conclusão resumindo os pontos chave

Formato: Estruture o conteúdo de forma que possa ser facilmente convertido em PDF.`,
        default: `Gere um conteúdo profissional e detalhado sobre: ${topic}`
      },
      en: {
        system: `You are an assistant specialized in generating professional and detailed content in English.
    
The content should include:
- A clear and engaging introduction
- Well-structured main points
- Practical examples when applicable
- A conclusion summarizing the key points

Format: Structure the content so it can be easily converted to PDF.`,
        default: `Generate professional and detailed content about: ${topic}`
      },
      es: {
        system: `Eres un asistente especializado en generar contenido profesional y detallado en español.
    
El contenido debe incluir:
- Una introducción clara y atractiva
- Puntos principales bien estructurados
- Ejemplos prácticos cuando sea aplicable
- Una conclusión resumiendo los puntos clave

Formato: Estructura el contenido de manera que pueda convertirse fácilmente en PDF.`,
        default: `Genera un contenido profesional y detallado sobre: ${topic}`
      },
      fr: {
        system: `Vous êtes un assistant spécialisé dans la génération de contenu professionnel et détaillé en français.
    
Le contenu doit inclure :
- Une introduction claire et engageante
- Des points principaux bien structurés
- Des exemples pratiques le cas échéant
- Une conclusion résumant les points clés

Format : Structurez le contenu de manière à pouvoir le convertir facilement en PDF.`,
        default: `Générez un contenu professionnel et détaillé sur : ${topic}`
      },
      de: {
        system: `Sie sind ein Assistent, der sich auf die Erstellung professioneller und detaillierter Inhalte auf Deutsch spezialisiert hat.
    
Der Inhalt sollte Folgendes enthalten:
- Eine klare und ansprechende Einführung
- Gut strukturierte Hauptpunkte
- Praktische Beispiele, wenn zutreffend
- Eine Zusammenfassung der wichtigsten Punkte

Format: Strukturieren Sie den Inhalt so, dass er leicht in PDF konvertiert werden kann.`,
        default: `Erstellen Sie professionelle und detaillierte Inhalte über: ${topic}`
      },
      it: {
        system: `Sei un assistente specializzato nella generazione di contenuti professionali e dettagliati in italiano.
    
Il contenuto deve includere:
- Un'introduzione chiara e coinvolgente
- Punti principali ben strutturati
- Esempi pratici quando applicabile
- Una conclusione che riassume i punti chiave

Formato: Struttura il contenuto in modo che possa essere facilmente convertito in PDF.`,
        default: `Genera un contenuto professionale e dettagliato su: ${topic}`
      }
    };

    const languageConfig = languageInstructions[language] || languageInstructions['pt'];
    const systemPrompt = languageConfig.system;
    const userPrompt = prompt || languageConfig.default;

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
      
      // Tratar erro 402 (sem créditos) especificamente
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'NO_CREDITS',
            message: 'Seus créditos do Lovable AI acabaram. Adicione créditos em Settings → Workspace → Usage.',
            code: 'NO_CREDITS'
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Tratar erro 429 (rate limit)
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'RATE_LIMIT',
            message: 'Limite de requisições atingido. Aguarde alguns instantes.',
            code: 'RATE_LIMIT'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
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
        // Gerar apenas 2 imagens para acelerar (máximo 2)
        const sectionsToImage = sections.slice(0, 2);
        
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
        // Se não houver seções, gerar apenas 1 imagem geral para acelerar
        console.log('No sections found, generating general image');
        
        const imagePrompt = `Professional stock photo related to ${topic}, high quality, corporate style, bright lighting, business people`;

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
