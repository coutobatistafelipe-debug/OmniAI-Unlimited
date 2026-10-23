# OmniAI Unlimited

Protótipo mobile-first para uma central de ferramentas e modelos de IA. Inclui uma interface funcional, navegação, seleção demonstrativa de modelos e um backend inicial para conectar um modelo via API.

## O que funciona nesta entrega
- Interface responsiva para celular e desktop.
- Navegação entre Chat, Modelos, Ferramentas, Histórico e Painel Admin demonstrativo.
- Atalhos de prompts, limpeza de conversa e seleção de arquivo.
- Endpoint Flask `/api/chat` preparado para OpenAI API.
- Respostas claramente identificadas como demonstração quando a API não está configurada.

## O que ainda precisa ser configurado
Cadastro/login real, banco de dados, autorização segura de administrador, armazenamento de conversas, upload e análise real de arquivos, geração de imagens/vídeos, pagamentos e integrações adicionais.

## Executar localmente
Requer Python 3.10+.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

Configure a chave no ambiente do servidor (não a coloque no frontend nem publique no GitHub):

```bash
# Linux/macOS
export OPENAI_API_KEY="sua-chave"
export OPENAI_MODEL="gpt-4o-mini"
python server.py
```

No Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="sua-chave"
$env:OPENAI_MODEL="gpt-4o-mini"
python server.py
```

Abra `http://127.0.0.1:5000`.

Sem a variável `OPENAI_API_KEY`, o chat permanece em modo de demonstração e não inventa respostas reais.

## Publicação
Publique em um serviço que suporte Python/Flask. Configure `OPENAI_API_KEY` e `OPENAI_MODEL` nas variáveis secretas do serviço. Use HTTPS. Antes de abrir a plataforma ao público, implemente autenticação, controle de acesso no backend, rate limiting, proteção contra abuso, banco de dados, política de privacidade e monitoramento de custos.

## Sobre o plano ADMIN UNLIMITED
O projeto pode dispensar uma cota diária interna para a conta administradora, mas isso não remove preços, limites de taxa, créditos ou condições dos provedores externos. Uso contínuo requer orçamento e infraestrutura adequados. Nunca compartilhe chaves de API em repositórios públicos.
