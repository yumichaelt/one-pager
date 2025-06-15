import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This is the prompt engineering part. It creates the detailed context for the AI.
const createPrompt = (documentContext, specificAction) => {
  const { title, fields } = documentContext;
  const fullDocumentText = fields.map(f => `## ${f.label}\n${f.value}`).join('\n\n');

  return `You are an expert Product Manager providing feedback on a new product proposal.

Here is the full context of the document you are reviewing:
---
# Document Title: ${title}

${fullDocumentText}
---

Now, focusing on the content provided, perform the following specific task: "${specificAction}".
Provide only the resulting text, without any preamble or extra formatting.
`;
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 1. Get the data from the user's request
  const { documentContext, specificAction } = await req.json();
  const apiKey = Deno.env.get('GEMINI_API_KEY');

  // We are using Google's Gemini Flash model here as an example.
  // The API endpoint and request body might differ for other providers like OpenAI.
  const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  // 2. Create the intelligent prompt
  const prompt = createPrompt(documentContext, specificAction);

  // 3. Construct the request body for the AI service
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  try {
    // 4. Securely call the AI service from the server
    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API request failed with status ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const refinedText = aiResult.candidates[0].content.parts[0].text;

    // 5. Send the result back to the user's browser
    return new Response(
      JSON.stringify({ refinedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}) 