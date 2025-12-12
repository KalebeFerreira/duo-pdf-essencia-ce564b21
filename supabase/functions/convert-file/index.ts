import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONVERT-FILE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUDCONVERT_API_KEY = Deno.env.get('CLOUDCONVERT_API_KEY');
    if (!CLOUDCONVERT_API_KEY) {
      throw new Error('CLOUDCONVERT_API_KEY not configured');
    }

    const { fileName, fileBase64, inputFormat, outputFormat } = await req.json();
    
    logStep('Starting conversion', { fileName, inputFormat, outputFormat });

    // Step 1: Create a job with import, convert, and export tasks
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'import-file': {
            operation: 'import/base64',
            file: fileBase64,
            filename: fileName,
          },
          'convert-file': {
            operation: 'convert',
            input: ['import-file'],
            output_format: outputFormat,
          },
          'export-file': {
            operation: 'export/url',
            input: ['convert-file'],
            inline: false,
            archive_multiple_files: false,
          },
        },
        tag: 'essencia-duo-conversion',
      }),
    });

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      logStep('CloudConvert job creation failed', { status: jobResponse.status, error: errorText });
      throw new Error(`CloudConvert error: ${errorText}`);
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.data.id;
    logStep('Job created', { jobId });

    // Step 2: Wait for job completion (poll)
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    let jobStatus = 'processing';
    let exportTask: any = null;

    while (attempts < maxAttempts && jobStatus !== 'finished' && jobStatus !== 'error') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check job status');
      }

      const statusData = await statusResponse.json();
      jobStatus = statusData.data.status;
      
      if (jobStatus === 'finished') {
        exportTask = statusData.data.tasks.find((t: any) => t.operation === 'export/url');
        logStep('Job completed', { exportTask: exportTask?.result });
      } else if (jobStatus === 'error') {
        const errorTask = statusData.data.tasks.find((t: any) => t.status === 'error');
        logStep('Job failed', { error: errorTask?.message });
        throw new Error(errorTask?.message || 'Conversion failed');
      }
      
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Conversion timeout');
    }

    if (!exportTask?.result?.files?.[0]?.url) {
      throw new Error('No output file generated');
    }

    const downloadUrl = exportTask.result.files[0].url;
    const outputFileName = exportTask.result.files[0].filename;

    logStep('Conversion successful', { downloadUrl, outputFileName });

    return new Response(JSON.stringify({ 
      success: true,
      downloadUrl,
      outputFileName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
