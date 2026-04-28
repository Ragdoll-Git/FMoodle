import requests
import logging
from utils.config import config_manager
from core.mcp import inject_context_if_needed
import time

# --- GROQ ---
def ask_groq(question: str, base64_image: str, api_key: str):
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                ]
            }
        ],
        "temperature": 0.27,
        "max_tokens": 4000
    }
    
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }

    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        err = resp.json().get('error', {}).get('message', f'Status {resp.status_code}')
        raise Exception(f"Groq Error: {err}")
    
    return resp.json()["choices"][0]["message"]["content"], "Llama 4 Scout"

# --- OPENAI ---
def ask_openai(question: str, base64_image: str, api_key: str):
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": "gpt-5", # En el original dice gpt-5
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ],
        "temperature": 0.4,
        "max_tokens": 4000
    }
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        err = resp.json().get('error', {}).get('message', f'Status {resp.status_code}')
        raise Exception(f"OpenAI Error: {err}")
    return resp.json()["choices"][0]["message"]["content"], "ChatGPT"

# --- CLAUDE ---
def ask_claude(question: str, base64_image: str, api_key: str):
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": base64_image
                        }
                    },
                    {
                        "type": "text",
                        "text": question
                    }
                ]
            }
        ]
    }
    headers = {
        "x-api-key": api_key.strip(),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        err = resp.json().get('error', {}).get('message', f'Status {resp.status_code}')
        raise Exception(f"Claude Error: {err}")
    return resp.json()["content"][0]["text"], "Claude 3.5 Sonnet"

# --- GEMINI (CASCADA Y RETRIES) ---
def fetch_gemini_with_retry(model, payload, api_key, retries=2):
    base_url = "https://generativelanguage.googleapis.com/v1beta/models/"
    url = f"{base_url}{model}:generateContent?key={api_key.strip()}"
    headers = {"Content-Type": "application/json"}
    
    for attempt in range(retries + 1):
        try:
            resp = requests.post(url, json=payload, headers=headers)
            if resp.status_code in (429, 503, 500):
                raise Exception(f"Server Error {resp.status_code}")
            return resp
        except Exception as e:
            if attempt < retries:
                time.sleep(1 * (2**attempt))
            else:
                return resp if 'resp' in locals() else None
    return None

def ask_gemini_cascade(question: str, base64_image: str, api_key: str):
    payload = {
        "contents": [{
            "parts": [
                {"text": question},
                {"inlineData": {"mimeType": "image/png", "data": base64_image}}
            ]
        }]
    }

    models = [
        ("gemini-3-flash-preview", "Gemini 3 Flash Preview"),
        ("gemini-2.5-flash", "Gemini 2.5 Flash"),
        ("gemini-2.5-flash-lite", "Gemini 2.5 Lite")
    ]

    for model_id, model_name in models:
        resp = fetch_gemini_with_retry(model_id, payload, api_key, retries=1)
        if resp and resp.status_code == 200:
            data = resp.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Sin respuesta.")
            return text, model_name
        else:
            logging.warning(f"Fallo Gemini modelo {model_name}")

    raise Exception("Todos los modelos Gemini fallaron.")

# --- ROUTER PRINCIPAL ---
def process_question(question: str, base64_image: str, provider: str, use_mcp: bool):
    try:
        final_question = inject_context_if_needed(question, use_mcp)
        
        if provider == 'gemini':
            key = config_manager.get('GEMINI_API_KEY')
            if not key: raise Exception("Falta Gemini API Key.")
            return ask_gemini_cascade(final_question, base64_image, key)
            
        elif provider == 'groq':
            key = config_manager.get('GROQ_API_KEY')
            if not key: raise Exception("Falta Groq API Key.")
            return ask_groq(final_question, base64_image, key)
            
        elif provider == 'openai':
            key = config_manager.get('OPENAI_API_KEY')
            if not key: raise Exception("Falta OpenAI API Key.")
            return ask_openai(final_question, base64_image, key)
            
        elif provider == 'claude':
            key = config_manager.get('CLAUDE_API_KEY')
            if not key: raise Exception("Falta Claude API Key.")
            return ask_claude(final_question, base64_image, key)
            
        else:
            raise Exception("Proveedor desconocido.")

    except Exception as e:
        original_error = str(e)
        logging.warning(f"Fallo primario con {provider}: {original_error}")
        
        # UNIVERSAL FALLBACK TO GROQ
        if provider not in ('groq', 'gemini'):
            try:
                logging.info("Intentando fallback universal a Groq...")
                key = config_manager.get('GROQ_API_KEY')
                if not key: raise Exception("Falta Groq API Key para el fallback.")
                ans, mod = ask_groq(final_question, base64_image, key)
                return ans, f"Fallback: {mod}"
            except Exception as e2:
                raise Exception(f"Fallo total: {original_error} -> Fallback error: {e2}")
        
        raise Exception(original_error)
