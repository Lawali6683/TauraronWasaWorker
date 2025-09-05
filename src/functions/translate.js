addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const API_KEY = '@haruna66';
const OPENROUTER_API_KEY = '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';

async function handleRequest(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const apiKeyHeader = request.headers.get('x-api-key');
    if (apiKeyHeader !== API_KEY) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { text, targetLang } = await request.json();

        if (!text || !targetLang) {
            return new Response(JSON.stringify({ error: 'Missing text or targetLang in request body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://leadwaypeace.pages.dev',
                'X-Title': 'Leadway App',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a translator. Translate the following text into ${targetLang}. Maintain the original formatting, including line breaks and gaps. If the target language is not supported, do not translate and respond with the original text.`,
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
            }),
        });

        const data = await response.json();
        const translatedText = data.choices[0].message.content;

        return new Response(JSON.stringify({ translatedText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Translation failed', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}