// groq.js - Actualizado a Llama 4 Scout
export async function askGroq(question, base64Image, apiKey) {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const payload = {
        // CAMBIO IMPORTANTE: Nuevo ID oficial de Llama 4 Scout (Vision)
        model: "meta-llama/llama-4-scout-17b-16e-instruct", 
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: question },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } }
                ]
            }
        ],
        temperature: 0.7,
        max_tokens: 1024
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
            // Mejora: Mostramos el código de error para debug (ej: model_decommissioned)
            throw new Error(errorData.error?.message || `Groq Error ${errorData.error?.code || response.status}`);
        }

        const result = await response.json();
        const answer = result.choices[0]?.message?.content;

        if (!answer) throw new Error("Respuesta vacía de Groq");

        return { success: true, text: answer, model: "Llama 4 Scout" };

    } catch (error) {
        console.error("Error en Groq Service:", error);
        return { success: false, error: error.message };
    }
}