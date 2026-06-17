// claude.js - Support for Anthropic Claude (Claude 3.5 Sonnet)
export async function askClaude(question, base64Image, apiKey) {
    const url = "https://api.anthropic.com/v1/messages";

    // Anthropic requires specialized headers, including the version
    // Danger: 'x-api-key' in frontend code is visible, but this is a personal extension.
    const headers = {
        'x-api-key': apiKey.replace(/[^\x00-\x7F]/g, "").trim(),
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        // 'anthropic-dangerous-direct-browser-access': 'true' // May be needed for browser fetch
        // Actually, since we are in a background service worker (Manifest V3), we usually don't need the browser-access header
        // if we have host_permissions. But Anthropic API often enforces CORS strictly.
        // Let's try standard first. If 403/CORS issues arise, we might need the header.
        'anthropic-dangerous-direct-browser-access': 'true'
    };

    const payload = {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: "image/png", // Assuming PNG from captureVisibleTab
                            data: base64Image
                        }
                    },
                    {
                        type: "text",
                        text: question
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Claude Error ${response.status}`);
        }

        const result = await response.json();
        // Structure: result.content[0].text
        const answer = result.content?.[0]?.text;

        if (!answer) throw new Error("Respuesta vacía de Claude");

        return { success: true, text: answer, model: "Claude 3.5 Sonnet" };

    } catch (error) {
        console.error("Error en Claude Service:", error);
        return { success: false, error: error.message };
    }
}
