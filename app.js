const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const messages = $("#messages");
const chatForm = $("#chatForm");
const promptInput = $("#promptInput");
const modelSelect = $("#modelSelect");
const content = $("#content");

let conversations = [];
let currentConversation = [];
let selectedFile = null;
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function saveHistory() {
  try {
    localStorage.setItem(
      "omniai_history",
      JSON.stringify(conversations.slice(-30))
    );
  } catch {
    showToast("Não foi possível salvar o histórico neste navegador.");
  }
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem("omniai_history") || "[]");
    conversations = Array.isArray(saved) ? saved : [];
  } catch {
    conversations = [];
  }
}

function renderMessages() {
  if (!messages) return;

  if (!currentConversation.length) {
    messages.innerHTML = `
      <div class="welcome-message">
        <div class="bot-orb">✳</div>
        <div>
          <b>Olá! Eu sou o OmniAI.</b>
          <p>Envie uma mensagem para começar uma nova conversa.</p>
        </div>
      </div>`;
    return;
  }

  messages.innerHTML = currentConversation.map((item) => `
    <div class="message ${item.role === "user" ? "user-message" : "assistant-message"}">
      <div class="message-label">
        ${item.role === "user" ? "Você" : "OmniAI"}
      </div>
      <div class="message-text">${escapeHTML(item.content).replace(/\n/g, "<br>")}</div>
    </div>
  `).join("");

  messages.scrollTop = messages.scrollHeight;
}

function persistCurrentConversation() {
  if (!currentConversation.length) return;

  const firstUserMessage = currentConversation.find(
    (item) => item.role === "user"
  );

  const title = firstUserMessage
    ? firstUserMessage.content.slice(0, 55)
    : "Nova conversa";

  const existingIndex = conversations.findIndex(
    (item) => item.id === currentConversation.id
  );

  const entry = {
    id: currentConversation.id || Date.now(),
    title,
    messages: [...currentConversation],
    updatedAt: new Date().toISOString()
  };

  currentConversation.id = entry.id;

  if (existingIndex >= 0) {
    conversations[existingIndex] = entry;
  } else {
    conversations.push(entry);
  }

  saveHistory();
}

function addMessage(role, text) {
  currentConversation.push({ role, content: text });
  renderMessages();
  persistCurrentConversation();
}

function newChat() {
  currentConversation = [];
  renderMessages();
  showToast("Nova conversa iniciada.");
  promptInput?.focus();
}

function setView(view) {
  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const labels = {
    chat: "Chat universal",
    models: "Explorar modelos",
    tools: "Ferramentas de IA",
    history: "Histórico",
    admin: "Painel admin"
  };

  if ($("#pageName")) {
    $("#pageName").textContent = labels[view] || "Workspace";
  }

  if (view === "chat") {
    renderMessages();
    return;
  }

  if (!content) return;

  if (view === "models") {
    content.innerHTML = `
      <div class="section-page">
        <div class="eyebrow">CENTRAL DE MODELOS</div>
        <h1>Explore modelos de IA</h1>
        <p>Selecione uma configuração disponível para suas conversas.</p>
        <div class="quick-grid">
          <button class="quick-card" data-model="demo">
            <span class="quick-icon purple">✳</span>
            <b>Modo demonstração</b>
            <small>Interface de teste, sem respostas reais de IA.</small>
          </button>
          <button class="quick-card" data-model="openai">
            <span class="quick-icon blue">◎</span>
            <b>OpenAI</b>
            <small>Depende de API válida configurada no servidor.</small>
          </button>
          <button class="quick-card" data-model="compatible">
            <span class="quick-icon green">◇</span>
            <b>Provedor compatível</b>
            <small>Integração adicional ainda precisa ser configurada.</small>
          </button>
        </div>
        <button class="subtle-btn" data-view="chat">Voltar ao chat</button>
      </div>`;

    $$("[data-model]").forEach((button) => {
      button.addEventListener("click", () => {
        if (modelSelect) modelSelect.value = button.dataset.model;
        showToast("Modelo selecionado: " + button.querySelector("b").textContent);
      });
    });
    $$("[data-view='chat']").forEach((button) => {
      button.addEventListener("click", () => setView("chat"));
    });
    return;
  }

  if (view === "tools") {
    content.innerHTML = `
      <div class="section-page">
        <div class="eyebrow">FERRAMENTAS</div>
        <h1>O que vamos criar?</h1>
        <p>Escolha uma tarefa para preparar uma mensagem no chat.</p>
        <div class="quick-grid">
          <button class="quick-card" data-tool-prompt="Crie um plano para desenvolver um site responsivo.">
            <span class="quick-icon purple">⌘</span><b>Gerador de sites</b>
            <small>Planeje páginas e funcionalidades.</small>
          </button>
          <button class="quick-card" data-tool-prompt="Revise e explique este código: ">
            <span class="quick-icon blue">{"</>"}</span><b>Assistente de código</b>
            <small>Analise código enviado na conversa.</small>
          </button>
          <button class="quick-card" data-tool-prompt="Crie um resumo organizado sobre: ">
            <span class="quick-icon orange">▤</span><b>Resumos</b>
            <small>Organize ideias e informações.</small>
          </button>
          <button class="quick-card" data-tool-prompt="Crie um roteiro detalhado para: ">
            <span class="quick-icon green">✎</span><b>Roteiros</b>
            <small>Estruture projetos e apresentações.</small>
          </button>
        </div>
      </div>`;

    $$("[data-tool-prompt]").forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.toolPrompt;
        setView("chat");
        promptInput.value = prompt;
        promptInput.focus();
      });
    });
    return;
  }

  if (view === "history") {
    content.innerHTML = `
      <div class="section-page">
        <div class="eyebrow">SUAS CONVERSAS</div>
        <h1>Histórico</h1>
        <p>Conversas salvas neste navegador.</p>
        <div id="historyList"></div>
        <button class="subtle-btn" id="historyNewChat">＋ Nova conversa</button>
      </div>`;

    const list = $("#historyList");

    if (!conversations.length) {
      list.innerHTML = "<p>Nenhuma conversa salva ainda.</p>";
    } else {
      list.innerHTML = [...conversations].reverse().map((item) => `
        <button class="quick-card history-card" data-history-id="${Number(item.id)}">
          <b>${escapeHTML(item.title || "Conversa")}</b>
          <small>${escapeHTML(item.updatedAt ? new Date(item.updatedAt).toLocaleString("pt-BR") : "")}</small>
        </button>
      `).join("");
    }

    $$("[data-history-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = conversations.find(
          (item) => item.id === Number(button.dataset.historyId)
        );

        if (!entry) return;

        currentConversation = [...entry.messages];
        currentConversation.id = entry.id;
        setView("chat");
        renderMessages();
      });
    });

    $("#historyNewChat")?.addEventListener("click", () => {
      newChat();
      setView("chat");
    });
    return;
  }

  if (view === "admin") {
    content.innerHTML = `
      <div class="section-page">
        <div class="eyebrow">ADMINISTRAÇÃO</div>
        <h1>Painel administrativo</h1>
        <p>Esta é uma área demonstrativa. Ela ainda não autentica administradores.</p>
        <div class="quick-grid">
          <div class="quick-card">
            <span class="quick-icon purple">◷</span>
            <b>${conversations.length}</b>
            <small>Conversas salvas neste navegador</small>
          </div>
          <div class="quick-card">
            <span class="quick-icon blue">◇</span>
            <b>${modelSelect?.value === "demo" ? "Demonstração" : "Selecionado"}</b>
            <small>Modo atual da interface</small>
          </div>
        </div>
        <p>Autenticação segura, gestão de usuários e permissões precisam ser implementadas no servidor antes de usar esta área em produção.</p>
      </div>`;
  }
}

async function sendMessage(text) {
  const userText = text.trim();
  if (!userText) return;

  if (!currentConversation.id) {
    currentConversation.id = Date.now();
  }

  addMessage("user", userText);

  promptInput.value = "";
  promptInput.style.height = "auto";

  const sendButton = chatForm.querySelector('[type="submit"]');
  if (sendButton) sendButton.disabled = true;

  const loading = document.createElement("div");
  loading.className = "message assistant-message";
  loading.innerHTML = `
    <div class="message-label">OmniAI</div>
    <div class="message-text">Processando sua mensagem...</div>`;
  messages.appendChild(loading);
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        model: modelSelect?.value || "demo",
        history: currentConversation
          .filter((item) => item.role === "user" || item.role === "assistant")
          .slice(-20)
      })
    });

    const data = await response.json().catch(() => ({}));
    loading.remove();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erro HTTP ${response.status}`);
    }

    const answer = data.reply || data.response || data.message;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("O servidor não retornou uma resposta válida.");
    }

    addMessage("assistant", answer);
  } catch (error) {
    loading.remove();
    addMessage(
      "assistant",
      "Não consegui obter uma resposta do servidor. Verifique se o Flask está em execução e se a rota /api/chat está configurada. Detalhe: " +
      error.message
    );
  } finally {
    if (sendButton) sendButton.disabled = false;
    promptInput?.focus();
  }
}

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(promptInput.value);
});

promptInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

promptInput?.addEventListener("input", () => {
  promptInput.style.height = "auto";
  promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + "px";
});

$("#newChat")?.addEventListener("click", newChat);

$("#clearChat")?.addEventListener("click", () => {
  currentConversation = [];
  renderMessages();
  showToast("Conversa limpa.");
});

$$(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

$$(".quick-card[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    setView("chat");
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
  });
});

$("#attachBtn")?.addEventListener("click", () => $("#fileInput")?.click());

$("#fileInput")?.addEventListener("change", (event) => {
  selectedFile = event.target.files?.[0] || null;
  const fileName = $("#fileName");

  if (fileName) {
    fileName.textContent = selectedFile
      ? selectedFile.name
      : "";
  }

  if (selectedFile) {
    showToast("Arquivo selecionado. O envio para análise ainda precisa ser implementado.");
  }
});

$("#openSidebar")?.addEventListener("click", () => {
  $("#sidebar")?.classList.add("open");
});

$("#closeSidebar")?.addEventListener("click", () => {
  $("#sidebar")?.classList.remove("open");
});

$$(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    $("#sidebar")?.classList.remove("open");
  });
});

loadHistory();
renderMessages();
    
