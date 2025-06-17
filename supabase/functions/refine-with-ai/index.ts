// supabase/functions/refine-with-ai/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// *** UPDATED PROMPT FUNCTION ***
// It now has special logic for the 'summarize' action
const createPrompt = (documentContext, targetField, specificAction) => {
  const { title } = documentContext;

  // --- NEW LOGIC FOR SUMMARIZATION ---
  if (specificAction.toLowerCase().includes('summarize')) {
    return `
      You are an expert Product Manager. Analyze the following text block and summarize its essential information.

      TEXT BLOCK TO ANALYZE:
      ${targetField.value}

      Your task is to return ONLY a valid JSON object. The object must have a single key, "items", which is an array of strings. Each string in the array should be one key bullet point.

      Example format:
      {
        "items": [
          "This is the first key point.",
          "This is the second key point."
        ]
      }

      Do not include any other text or explanation outside of the JSON object.
    `;
  }
  
  // --- Original logic for all other actions ---
  const fullDocumentText = documentContext.fields.map(f => `## ${f.label}\n${f.value}`).join('\n\n');
  return `You are an expert Product Manager providing feedback on a new product proposal.
    Here is the full context of the document:
    ---
    # Document Title: ${title}
    ${fullDocumentText}
    ---
    Now, focus ONLY on the following section:
    ## Section to Refine: ${targetField.label}
    ### Current Content:
    ${targetField.value}
    Your specific task is to: "${specificAction}".
    Provide ONLY the improved text for this section.
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentContext, targetField, specificAction } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const prompt = createPrompt(documentContext, targetField, specificAction);

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      // *** NEW: Conditionally set the response MIME type for summarization ***
      generationConfig: specificAction.toLowerCase().includes('summarize') 
        ? { responseMimeType: "application/json" } 
        : undefined
    };

    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!aiResponse.ok) {
        const errorBody = await aiResponse.text();
        throw new Error(`AI API request failed: ${errorBody}`);
    }

    const aiResult = await aiResponse.json();
    let responseData;

    // *** NEW: Handle both plain text and structured JSON responses ***
    if (specificAction.toLowerCase().includes('summarize')) {
      // The AI returns a JSON string, so we parse it
      responseData = JSON.parse(aiResult.candidates[0].content.parts[0].text);
    } else {
      // For other actions, it's just plain text
      responseData = { refinedText: aiResult.candidates[0].content.parts[0].text };
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
