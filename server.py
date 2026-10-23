"""Backend inicial do OmniAI Unlimited. Requer Python 3.10+ e Flask."""
import os
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

app = Flask(__name__, static_folder=".", static_url_path="")
@app.get("/")
def index():
    return send_from_directory(".", "index.html")

@app.post("/api/chat")
def chat():
    # Configure OPENAI_API_KEY e, opcionalmente, OPENAI_MODEL no ambiente do servidor.
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"error": "Provedor não configurado"}), 503
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Mensagem vazia"}), 400
    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": message}],
        )
        return jsonify({"reply": response.choices[0].message.content or ""})
    except Exception:
        # Não devolver detalhes internos nem segredos ao navegador.
        app.logger.exception("Falha ao consultar o provedor de IA")
        return jsonify({"error": "O provedor não respondeu. Verifique a configuração e os limites da API."}), 502

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
