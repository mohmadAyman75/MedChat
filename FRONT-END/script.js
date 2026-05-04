const STORAGE_KEY = "nova-chat-state-v2";

const state = {
  chats: [],
  currentChatId: null,
  search: "",
  model: "نوفا برو",
  tools: new Set(),
  attachments: [],
  settings: {
    theme: "light",
    compact: false,
    autoTitle: true,
    tone: "balanced",
  },
};

let activeConversationMenuChatId = null;
let editingChatId = null;

const els = {
  app: document.querySelector(".app-shell"),
  projectTitleButton: document.querySelector("#projectTitleButton"),
  sidebarToggle: document.querySelector(".sidebar-toggle"),
  mobileSidebarToggle: document.querySelector(".mobile-sidebar-toggle"),
  newChatButton: document.querySelector("#newChatButton"),
  searchButton: document.querySelector("#searchButton"),
  railPinnedButton: document.querySelector("#railPinnedButton"),
  railChatButton: document.querySelector("#railChatButton"),
  searchSheet: document.querySelector("#searchSheet"),
  chatSearch: document.querySelector("#chatSearch"),
  searchResults: document.querySelector("#searchResults"),
  conversationMenu: document.querySelector("#conversationMenu"),
  menuPinLabel: document.querySelector("#menuPinLabel"),
  conversationGroups: document.querySelector("#conversationGroups"),
  profileButton: document.querySelector("#profileButton"),
  profileSheet: document.querySelector("#profileSheet"),
  settingsSheet: document.querySelector("#settingsSheet"),
  themeButton: document.querySelector("#themeButton"),
  clearButton: document.querySelector("#clearButton"),
  exportButton: document.querySelector("#exportButton"),
  toolsMenu: document.querySelector("#toolsMenu"),
  promptInput: document.querySelector("#promptInput"),
  composer: document.querySelector("#composer"),
  sendButton: document.querySelector("#sendButton"),
  messages: document.querySelector("#messages"),
  messageScroll: document.querySelector("#messageScroll"),
  emptyState: document.querySelector("#emptyState"),
  suggestionGrid: document.querySelector("#suggestionGrid"),
  attachButton: document.querySelector("#attachButton"),
  fileInput: document.querySelector("#fileInput"),
  attachmentRow: document.querySelector("#attachmentRow"),
  micButton: document.querySelector("#micButton"),
  temporaryChatButton: document.querySelector("#temporaryChatButton"),
  shareButton: document.querySelector("#shareButton"),
  topChatMenuButton: document.querySelector("#topChatMenuButton"),
  topChatMenu: document.querySelector("#topChatMenu"),
  topMenuPinLabel: document.querySelector("#topMenuPinLabel"),
  toast: document.querySelector("#toast"),
  compactToggle: document.querySelector("#compactToggle"),
  titleToggle: document.querySelector("#titleToggle"),
  toneSelect: document.querySelector("#toneSelect"),
  chatView: document.querySelector("#chatView"),
};

const starterChats = [
  {
    title: "أفكار واجهة Deep ANN",
    messages: [
      {
        role: "assistant",
        content:
          "أقدر أساعدك ترسم شكل الواجهة، تربط عناصر التحكم، وتنظم خطوات تدريب الشبكة العصبية.",
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
      },
    ],
  },
  {
    title: "حلقة تدريب Python",
    messages: [
      {
        role: "assistant",
        content:
          "ابعتلي السكريبت الحالي وأنا أحوله لحلقة تدريب مرتبة فيها قياسات ونتائج واضحة.",
        createdAt: Date.now() - 1000 * 60 * 60 * 26,
      },
    ],
  },
];

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.chats = Array.isArray(parsed.chats) ? parsed.chats : [];
      state.currentChatId = parsed.currentChatId || null;
      state.model = parsed.model || state.model;
      state.settings = { ...state.settings, ...(parsed.settings || {}) };
      state.tools = new Set(parsed.tools || []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  if (!state.chats.length) {
    state.chats = [
      {
        id: createId(),
        title: "محادثة جديدة",
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
      ...starterChats.map((chat) => ({
        id: createId(),
        title: chat.title,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: chat.messages[0].createdAt,
        messages: chat.messages.map((message) => ({
          id: createId(),
          model: "نوفا برو",
          ...message,
        })),
      })),
    ];
  }

  if (!state.currentChatId || !state.chats.some((chat) => chat.id === state.currentChatId)) {
    state.currentChatId = state.chats[0]?.id || createChat();
  }
}

function saveState() {
  const persistedChats = state.chats.filter((chat) => !chat.temporary);
  const persistedCurrentChatId = persistedChats.some((chat) => chat.id === state.currentChatId)
    ? state.currentChatId
    : persistedChats[0]?.id || null;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      chats: persistedChats,
      currentChatId: persistedCurrentChatId,
      model: state.model,
      tools: Array.from(state.tools),
      settings: state.settings,
    }),
  );
}

function currentChat() {
  return state.chats.find((chat) => chat.id === state.currentChatId);
}

function discardTemporaryChats(exceptId = null) {
  const before = state.chats.length;
  state.chats = state.chats.filter((chat) => !chat.temporary || chat.id === exceptId);

  if (state.currentChatId && !state.chats.some((chat) => chat.id === state.currentChatId)) {
    state.currentChatId = state.chats[0]?.id || null;
  }

  return before !== state.chats.length;
}

function createChat() {
  discardTemporaryChats();

  const chat = {
    id: createId(),
    title: "محادثة جديدة",
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  state.chats.unshift(chat);
  state.currentChatId = chat.id;
  saveState();
  render();
  focusPrompt();
  return chat.id;
}

function makeTemporaryChat() {
  let chat = currentChat();

  if (chat?.temporary) {
    showToast("هذه محادثة مؤقتة");
    focusPrompt();
    return;
  }

  if (!chat || chat.messages.length > 0) {
    createChat();
    chat = currentChat();
  }
  if (!chat) return;

  chat.temporary = true;
  chat.title = "محادثة مؤقتة";
  chat.updatedAt = Date.now();
  saveState();
  render();
  showToast("تم تفعيل المحادثة المؤقتة");
  focusPrompt();
}

function deleteChat(chatId) {
  const index = state.chats.findIndex((chat) => chat.id === chatId);
  if (index === -1) return;
  state.chats.splice(index, 1);
  if (!state.chats.length) createChat();
  if (state.currentChatId === chatId) state.currentChatId = state.chats[0].id;
  saveState();
  render();
}

function renameChat(chatId) {
  startInlineRename(chatId);
}

function startInlineRename(chatId) {
  if (!state.chats.some((item) => item.id === chatId)) return;
  editingChatId = chatId;
  renderSidebar();
  window.setTimeout(() => {
    const input = els.conversationGroups.querySelector(`[data-rename-input="${chatId}"]`);
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 0);
}

function finishInlineRename({ revert = false } = {}) {
  if (!editingChatId) return;
  const input = els.conversationGroups.querySelector(`[data-rename-input="${editingChatId}"]`);
  const chat = state.chats.find((item) => item.id === editingChatId);

  if (chat && input) {
    if (revert) {
      chat.title = input.dataset.originalTitle || chat.title;
    } else {
      chat.title = input.value.trim().slice(0, 80) || "محادثة جديدة";
    }
    chat.updatedAt = Date.now();
    saveState();
  }

  editingChatId = null;
  renderSidebar();
}

function pinChat(chatId) {
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat) return;
  chat.pinned = !chat.pinned;
  chat.updatedAt = Date.now();
  saveState();
  renderSidebar();
}

function addMessage(role, content, metadata = {}) {
  let chat = currentChat();
  if (!chat) {
    createChat();
    chat = currentChat();
  }

  const message = {
    id: createId(),
    role,
    content,
    createdAt: Date.now(),
    ...metadata,
  };

  chat.messages.push(message);
  chat.updatedAt = Date.now();

  if (role === "user" && state.settings.autoTitle && (chat.title === "محادثة جديدة" || !chat.title)) {
    chat.title = content.replace(/\s+/g, " ").trim().slice(0, 58) || "محادثة جديدة";
  }

  saveState();
  render();
  scrollToBottom();
  return message;
}

