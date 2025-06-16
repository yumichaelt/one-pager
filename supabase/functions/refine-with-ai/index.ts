import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// *** UPDATED PROMPT FUNCTION ***
const createPrompt = (documentContext, targetField, specificAction) => {
  const { title, fields } = documentContext;
  // We still build the full document to give the AI complete context
  const fullDocumentText = fields.map(f => `## ${f.label}\n${f.value}`).join('\n\n');

  return `You are an expert Product Manager providing feedback on a new product proposal.

Here is the full context of the document you are reviewing:
---
# Document Title: ${title}

${fullDocumentText}
---

Now, I want you to focus ONLY on the following specific section of the document:

## Section to Refine: "${targetField.label}"
### Current Content of this Section:
"${targetField.value}"

Your specific task is to: "${specificAction}".

Please provide ONLY the improved text for this specific section. Do not repeat the section title or add any extra commentary. Your response should be ready to be used as a direct replacement for the current content.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // *** RECEIVE THE NEW targetField DATA ***
    const { documentContext, targetField, specificAction } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // *** PASS targetField to the prompt creator ***
    const prompt = createPrompt(documentContext, targetField, specificAction);

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!aiResponse.ok) {
        const errorBody = await aiResponse.text();
        console.error("AI API Error:", errorBody);
        throw new Error(`AI API request failed with status ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const refinedText = aiResult.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ refinedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}) 