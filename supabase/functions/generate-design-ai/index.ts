import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[GENERATE-DESIGN-AI ${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('Error: Missing authorization header');
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token and create Supabase client
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user with explicit token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      logStep('Error: Invalid user', { error: userError?.message, tokenLength: token.length });
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id });

    const { prompt, template } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurado');
      return new Response(
        JSON.stringify({ error: "API key não configurada" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Template dimensions for context
    const templateInfo: Record<string, string> = {
      flyer: "A5 flyer (148x210mm)",
      "business-card": "Business card (90x50mm)",
      pamphlet: "A4 pamphlet (210x297mm)",
    };

    const templateContext = templateInfo[template] || "standard design";
    
    const enhancedPrompt = `Create a professional print-ready design for ${templateContext}. ${prompt}. The design should be high-quality, print-ready with proper margins, and visually appealing. Ultra high resolution.`;

    logStep('Generating design', { userId: user.id, template, prompt: enhancedPrompt });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error(`Erro do AI Gateway (${status}):`, errorText);

      if (status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos da IA esgotados. Adicione créditos em Settings -> Workspace -> Usage",
            message: "Sem créditos disponíveis",
            code: "NO_CREDITS"
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisições excedido. Aguarde um momento",
            message: "Rate limit excedido",
            code: "RATE_LIMIT"
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar arte com IA" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    logStep('AI response received', { 
      userId: user.id,
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      messageKeys: data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : [],
      fullResponse: JSON.stringify(data).substring(0, 500)
    });

    // Extract image from response - check multiple possible locations
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Alternative: check if image is directly in content
    if (!imageUrl && data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      // Check if content is an array with image objects
      if (Array.isArray(content)) {
        const imageContent = content.find((c: any) => c.type === 'image_url' || c.type === 'image');
        if (imageContent) {
          imageUrl = imageContent.image_url?.url || imageContent.url;
        }
      }
    }

    // Alternative: check inline_data format
    if (!imageUrl && data.choices?.[0]?.message?.images?.[0]?.inline_data) {
      const inlineData = data.choices[0].message.images[0].inline_data;
      imageUrl = `data:${inlineData.mime_type};base64,${inlineData.data}`;
    }

    if (!imageUrl) {
      console.error('Nenhuma imagem retornada pela IA. Response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem gerada. Tente novamente com outro prompt." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Image extracted successfully', { userId: user.id, imageUrlLength: imageUrl.length });

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no generate-design-ai:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
