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
    const { prompt, language = 'pt', numChapters = 5, model = 'gpt-4o-mini' } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Generating ebook with OpenAI:', { prompt, language, numChapters, model });

    const languageNames: Record<string, string> = {
      pt: 'Brazilian Portuguese',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
    };

    const langName = languageNames[language] || 'Brazilian Portuguese';

    const systemPrompt = `You are a professional ebook writer and content creator. Your task is to generate high-quality, engaging ebook content.

IMPORTANT RULES:
- Write entirely in ${langName}
- Be creative, engaging, and informative
- Use clear structure with proper formatting
- Include practical examples and actionable insights
- Make content accessible to general audiences
- Each chapter should be 300-400 words`;

    const userPrompt = `Create an ebook about: "${prompt}"

Generate the following in JSON format:
{
  "title": "Compelling ebook title",
  "description": "Brief 2-3 sentence description of the ebook",
  "chapters": [
    {
      "title": "Chapter title",
      "content": "Full chapter content with 300-400 words, well-structured paragraphs"
    }
  ]
}

Requirements:
- Generate exactly ${numChapters} chapters
- Each chapter should have unique, valuable content
- Use engaging writing style
- Include practical tips and examples
- Write EVERYTHING in ${langName}

Return ONLY valid JSON, no additional text.`;

    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: model === 'gpt-4o' ? 8000 : 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again in a moment.',
            code: 'RATE_LIMITED'
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log('OpenAI response received in', processingTime, 'ms');

    // Parse the JSON response
    let ebook;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      
      ebook = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Raw response:', generatedText);
      throw new Error('Failed to parse ebook content');
    }

    return new Response(
      JSON.stringify({ 
        ...ebook,
        model: 'gpt-4o-mini',
        processingTime,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-ebook-openai:', error);
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
