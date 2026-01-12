// openai.js - Support for OpenAI (ChatGPT)
export async function askOpenAI(question, base64Image, apiKey) {
    const url = "https://api.openai.com/v1/chat/completions";

    const payload = {
        model: "gpt-5",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: question },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }
        ],
        temperature: 0.4,
        max_tokens: 4000
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `OpenAI Error ${response.status}`);
        }

        const result = await response.json();
        const answer = result.choices[0]?.message?.content;

        if (!answer) throw new Error("Respuesta vacía de OpenAI");

        return { success: true, text: answer, model: "ChatGPT (GPT-5)" };

    } catch (error) {
        console.error("Error en OpenAI Service:", error);
        return { success: false, error: error.message };
    }
}
