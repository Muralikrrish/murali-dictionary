export async function onRequest(context) {
  // 1. Get the prompt from the user's request
  let requestBody;
  try {
    requestBody = await context.request.json();
  } catch (e) {
    return new Response('Bad Request: No JSON found', { status: 400 });
  }

  const userPrompt = requestBody.prompt;

  if (!userPrompt) {
    return new Response('Missing prompt', { status: 400 });
  }

  // 2. Prepare the request to Groq
  // We use the environment variable GROQ_API_KEY (Set in Cloudflare Dashboard)
  const GROQ_API_KEY = context.env.GROQ_API_KEY; 

  if (!GROQ_API_KEY) {
     return new Response(JSON.stringify({ error: 'Server Error: API Key missing' }), { status: 500 });
  }

  const payload = {
    // The "Smart" Model you requested
    model: "llama-3.3-70b-versatile", 
    messages: [
      {
        role: "system",
        content: "You are a helpful knowledge assistant. Do not introduce yourself. Do not mention being an AI. Just answer the user's question directly, concisely, and accurately."
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.5,
    max_tokens: 1024
  };

  // 3. Send to Groq
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'AI Error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Send the answer back to your website
    const aiAnswer = data.choices[0].message.content;
    return new Response(JSON.stringify({ answer: aiAnswer }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
