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
    const { title, content, language = 'pt', ebookTheme } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Improving chapter:', title);

    const languageInstructions: Record<string, string> = {
      pt: 'em Português do Brasil',
      en: 'in English',
      es: 'en Español',
      fr: 'en Français',
      de: 'auf Deutsch',
      it: 'in Italiano',
    };

    const langInstruction = languageInstructions[language] || languageInstructions['pt'];

    const improvementPrompt = `You are an expert content editor and writer specializing in ebooks.

Your task is to improve and enhance the following chapter content while maintaining its core message and structure.

CHAPTER TITLE: "${title}"
EBOOK THEME: "${ebookTheme || 'General topic'}"

CURRENT CONTENT:
${content}

IMPROVEMENT GUIDELINES:
- Keep the same length (300-400 words approximately)
- Make the text more engaging and professional
- Improve clarity and readability
- Add specific examples or analogies where appropriate
- Use active voice and strong verbs
- Ensure smooth flow between paragraphs
- Maintain bullet points and structure if present
- Keep technical accuracy
- Write ENTIRELY ${langInstruction}

IMPORTANT: Return ONLY the improved content text, no explanations or additional comments.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: improvementPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI improvement error:', response.status, errorText);
      
      if (response.status === 402) {
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
      
      throw new Error('Failed to improve chapter content');
    }

    const data = await response.json();
    const improvedContent = data.choices?.[0]?.message?.content || '';
    
    console.log('Chapter improved successfully');

    return new Response(
      JSON.stringify({ 
        improvedContent,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in improve-chapter:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred improving chapter' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
