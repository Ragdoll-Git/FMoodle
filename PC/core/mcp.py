import requests
from utils.config import config_manager
import logging

def get_mcp_context(query: str) -> str:
    """
    Intenta obtener contexto de un servidor MCP si está habilitado.
    Devuelve el texto a inyectar o un string vacío si falla o está deshabilitado.
    """
    if not config_manager.get("MCP_ENABLED"):
        return ""
    
    url = config_manager.get("MCP_URL")
    mode = config_manager.get("MCP_MODE", "local")
    
    if not url:
        logging.warning("MCP activado pero no hay URL configurada.")
        return ""

    try:
        response = requests.post(
            url,
            json={"query": query, "mode": mode},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            context = data.get("context", data.get("data", data.get("text", str(data))))
            return context
        else:
            logging.warning(f"Error servidor MCP. Status: {response.status_code}")
    except Exception as e:
        logging.warning(f"No se pudo conectar al MCP: {e}")
    
    return ""

def inject_context_if_needed(query: str, use_mcp: bool) -> str:
    """
    Si use_mcp es True, intenta buscar el contexto y lo pre-inyecta en la query.
    """
    if not use_mcp:
        return query
    
    context_text = get_mcp_context(query)
    if context_text:
        return f"[CONTEXTO ADICIONAL MCP:\n{context_text}\n]\n\nPREGUNTA DEL USUARIO:\n{query}"
    
    return query
