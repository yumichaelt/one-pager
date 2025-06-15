import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createPrompt = (title: string) => {
  return `You are an expert Senior Product Manager, using the "Working Backwards" process to flesh out a new product idea.

    The title of the new product is: "${title}"

    Your task is to first, internally, write a short, future-dated press release announcing this product to the world. The press release should be customer-obsessed and clearly explain the user's problem and how the product solves it.

    Second, using ONLY the information from the press release you just wrote, generate a structured one-pager document.

    You MUST return your response as a valid JSON object. The JSON object must have a single key, "fields", which is an array of objects. Each object in the array must have two keys: "label" and "value".

    The sections you MUST generate are:
    - Problem Statement
    - Proposed Solution
    - Target Audience
    - Success Metrics
    - Potential Risks
    - Mitigation Plan
    - Timeline

    Example of the required JSON format:
    {
      "fields": [
        { "label": "Problem Statement", "value": "Your generated text..." },
        { "label": "Proposed Solution", "value": "Your generated text..." }
      ]
    }

    Do not include the press release in the final JSON output, only use it for your internal thinking to generate the fields.
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { title } = await req.json();
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const prompt = createPrompt(title);

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  try {
    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API request failed with status ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const generatedOnePager = JSON.parse(aiResult.candidates[0].content.parts[0].text);

    return new Response(
      JSON.stringify({ generatedOnePager }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}) 