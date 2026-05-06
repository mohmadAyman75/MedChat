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

function buildAssistantReply(prompt) {
  const activeTools = Array.from(state.tools);
  const toolText = activeTools.length ? `\n\nالأدوات المفعلة: ${activeTools.join("، ")}.` : "";
  const attachmentText = state.attachments.length
    ? `\n\nشايف كمان أسماء الملفات المرفقة: ${state.attachments.map((file) => file.name).join("، ")}.`
    : "";

  const urgentSigns =
    "لو عندك صعوبة في التنفس، ألم شديد في الصدر، إغماء، قيء مستمر، نزيف، أو حرارة عالية جدًا ومستمرة، الأفضل تراجع دكتور أو طوارئ فورًا.";

  if (state.settings.tone === "concise") {
    return `فهمت إن المشكلة هي: "${prompt.slice(0, 160)}".\n\nاشرب سوائل، ارتاح، وراقب الأعراض. ${urgentSigns}${attachmentText}`;
  }

  if (state.settings.tone === "detailed") {
    return `فهمت الأعراض اللي كتبتها: "${prompt}".\n\nمبدئيًا، حاول تتابع شدة الأعراض ووقت ظهورها، واشرب سوائل كفاية، وارتاح. لو الأعراض بتزيد أو مستمرة أكتر من يومين/تلاتة، الأفضل تستشير دكتور.\n\n${urgentSigns}${attachmentText}`;
  }

  return `فهمت، الأعراض عندك: "${prompt.slice(0, 220)}".\n\nممكن أساعدك ترتب الأعراض وتعرف إمتى الموضوع يحتاج كشف. مبدئيًا: راقب الحرارة، اشرب سوائل، وارتاح. ${urgentSigns}${attachmentText}`;

  if (state.settings.tone === "concise") {
    return `تمام. الاتجاه المختصر:\n\n1. خلي الشريط الجانبي للمحادثات السابقة.\n2. خلي اختيار النموذج وأزرار المشاركة والإعدادات في الشريط العلوي.\n3. خلي صندوق الكتابة في الأسفل ومعاه الملفات والأدوات والصوت والإرسال.\n\nرسالتك: "${prompt.slice(0, 160)}"${toolText}${attachmentText}`;
  }

  if (state.settings.tone === "detailed") {
    return `فهمت المطلوب: مساحة شات عربية منظمة بإحساس قريب من أدوات الذكاء الاصطناعي الحديثة.\n\nهقسمها كده:\n\n1. التنقل: محادثات حديثة، بحث، تثبيت، وروابط مساحة العمل.\n2. الشات الرئيسي: حالة بداية، اقتراحات، رسائل واضحة، وأزرار للنسخ والتعديل وإعادة المحاولة.\n3. صندوق الكتابة: إرفاق ملفات، تشغيل أدوات، إدخال صوتي، وإرسال.\n4. الإعدادات: الثيم، كثافة الرسائل، التصدير، وإدارة المحادثات.\n\nرسالتك كانت: "${prompt}"${toolText}${attachmentText}`;
  }

  return `تمام، فهمتك. أقدر أتعامل مع الطلب ده كواجهة شات كاملة: Sidebar للمحادثات، شريط علوي للموديل والمشاركة والإعدادات، ومنطقة كتابة فيها ملفات وأدوات وصوت وإرسال.\n\nرسالتك: "${prompt.slice(0, 220)}"${toolText}${attachmentText}`;
}

function simulateAssistant(prompt) {
  const chat = currentChat();
  if (!chat) return;

  const typingMessage = addMessage("assistant", "", { isTyping: true, model: state.model });
  const delay = Math.min(1400, Math.max(650, prompt.length * 11));

  window.setTimeout(() => {
    const activeChat = currentChat();
    const targetChat = state.chats.find((item) => item.messages.some((msg) => msg.id === typingMessage.id));
    if (!targetChat) return;
    const message = targetChat.messages.find((msg) => msg.id === typingMessage.id);
    if (!message) return;
    message.isTyping = false;
    message.content = buildAssistantReply(prompt);
    message.model = state.model;
    targetChat.updatedAt = Date.now();
    saveState();
    if (activeChat?.id === targetChat.id) {
      renderMessages();
      renderSidebar();
      scrollToBottom();
    }
  }, delay);
}

function submitPrompt(text = els.promptInput.value) {
  const prompt = text.trim();
  if (!prompt) return;

  addMessage("user", prompt, {
    attachments: state.attachments.map((file) => ({ name: file.name, size: file.size })),
  });
  els.promptInput.value = "";
  state.attachments = [];
  syncPromptInput();
  renderAttachments();
  simulateAssistant(prompt);
}

function groupChats(chats) {
  const groups = [
    { title: "مثبتة", items: chats.filter((chat) => chat.pinned) },
    { title: "اليوم", items: [] },
    { title: "السابق", items: [] },
  ];

  const today = new Date().toDateString();
  chats
    .filter((chat) => !chat.pinned)
    .forEach((chat) => {
      const group = new Date(chat.updatedAt).toDateString() === today ? groups[1] : groups[2];
      group.items.push(chat);
    });

  return groups.filter((group) => group.items.length);
}

function renderSidebar() {
  const chats = state.chats
    .filter((chat) => !chat.temporary)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

  if (!chats.length) {
    els.conversationGroups.innerHTML = `<div class="conversation-group"><h3>لا توجد نتائج</h3></div>`;
    return;
  }

  els.conversationGroups.innerHTML = groupChats(chats)
    .map(
      (group) => `
        <section class="conversation-group">
          <h3>${escapeHtml(group.title)}</h3>
          ${group.items
            .map(
              (chat) => `
                <div class="conversation-item ${chat.id === state.currentChatId ? "is-active" : ""}">
                  ${
                    editingChatId === chat.id
                      ? `<div class="conversation-button conversation-button--editing">
                          <i data-lucide="${chat.pinned ? "pin" : "message-square"}"></i>
                          <input
                            class="conversation-rename-input"
                            type="text"
                            value="${escapeHtml(chat.title)}"
                            data-rename-input="${chat.id}"
                            data-original-title="${escapeHtml(chat.title)}"
                            aria-label="تعديل اسم المحادثة"
                          />
                        </div>`
                      : `<button class="conversation-button" type="button" data-chat-id="${chat.id}">
                          <i data-lucide="${chat.pinned ? "pin" : "message-square"}"></i>
                          <span>${escapeHtml(chat.title)}</span>
                        </button>`
                  }
                  <span class="conversation-actions">
                    <button class="conversation-action" type="button" data-action="menu" data-chat-id="${chat.id}" aria-label="خيارات المحادثة" title="خيارات المحادثة">
                      <i data-lucide="ellipsis"></i>
                    </button>
                  </span>
                </div>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("");
  refreshIcons();
}

function renderSearchResults() {
  if (!els.searchResults) return;

  const query = state.search.trim().toLowerCase();
  const chats = state.chats
    .filter((chat) => !chat.temporary)
    .filter((chat) => !query || chat.title.toLowerCase().includes(query))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
    .slice(0, 12);

  if (!chats.length) {
    els.searchResults.innerHTML = `<p class="search-empty">لا توجد نتائج</p>`;
    return;
  }

  els.searchResults.innerHTML = chats
    .map(
      (chat) => `
        <button class="search-result" type="button" data-open-search-chat="${chat.id}">
          <i data-lucide="${chat.pinned ? "pin" : "message-square"}"></i>
          <span>
            <strong>${escapeHtml(chat.title)}</strong>
            <small>${chat.messages.length} رسائل · ${formatDate(chat.updatedAt)}</small>
          </span>
        </button>
      `,
    )
    .join("");
  refreshIcons();
}

function renderMessages() {
  const chat = currentChat();
  const messages = chat?.messages || [];
  syncChatViewState();

  els.messages.innerHTML = messages
    .map((message) => {
      const avatarIcon = message.role === "assistant" ? "sparkles" : "";
      const userAvatar = message.role === "user" ? `<span class="message__avatar">أ</span>` : "";
      const assistantAvatar =
        message.role === "assistant"
          ? `<span class="message__avatar"><i data-lucide="${avatarIcon}"></i></span>`
          : "";
      const attachmentChips = (message.attachments || [])
        .map(
          (file) => `
            <span class="message-chip">
              <i data-lucide="paperclip"></i>
              ${escapeHtml(file.name)}
            </span>
          `,
        )
        .join("");
      const content = message.isTyping
        ? `<span class="typing" aria-label="المساعد يكتب الآن"><span></span><span></span><span></span></span>`
        : linkify(escapeHtml(message.content));
      const messageActions =
        message.role === "user"
          ? `
                    <button class="message-action" type="button" data-message-action="copy" aria-label="نسخ" title="نسخ">
                      <i data-lucide="copy"></i>
                    </button>
                    <button class="message-action" type="button" data-message-action="edit" aria-label="تعديل" title="تعديل">
                      <i data-lucide="pencil"></i>
                    </button>`
          : `
                    <button class="message-action" type="button" data-message-action="copy" aria-label="نسخ" title="نسخ">
                      <i data-lucide="copy"></i>
                    </button>
                    <button class="message-action" type="button" data-message-action="speak" aria-label="تشغيل الصوت" title="تشغيل الصوت">
                      <i data-lucide="volume-2"></i>
                    </button>
                    <button class="message-action" type="button" data-message-action="retry" aria-label="إعادة المحاولة" title="إعادة المحاولة">
                      <i data-lucide="refresh-cw"></i>
                    </button>`;

      return `
        <article class="message message--${message.role}" data-message-id="${message.id}">
          ${assistantAvatar}
            ${userAvatar}
          <div class="message__content">
            <div class="bubble">${content}</div>
            ${attachmentChips ? `<div class="message__meta">${attachmentChips}</div>` : ""}
            ${
              message.isTyping
                ? ""
                : `<div class="message-actions">
                    ${messageActions}
                  </div>`
            }
          </div>
        </article>
      `;
    })
    .join("");
  refreshIcons();
}

function renderAttachments() {
  els.attachmentRow.hidden = state.attachments.length === 0;
  els.attachmentRow.innerHTML = state.attachments
    .map(
      (file, index) => `
        <span class="attachment-pill">
          <i data-lucide="file"></i>
          <span>${escapeHtml(file.name)}</span>
          <button type="button" data-remove-attachment="${index}" aria-label="إزالة المرفق" title="إزالة المرفق">
            <i data-lucide="x"></i>
          </button>
        </span>
      `,
    )
    .join("");
  refreshIcons();
}

function renderTools() {
  if (!els.toolsMenu) return;
  els.toolsMenu.querySelectorAll("[data-tool]").forEach((button) => {
    const tool = button.dataset.tool;
    const enabled = state.tools.has(tool);
    button.setAttribute("aria-checked", String(enabled));
    button.querySelector("strong").textContent = enabled ? "مفتوح" : "مغلق";
  });
}

function renderSettings() {
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.dataset.density = state.settings.compact ? "compact" : "comfortable";
  els.compactToggle.checked = state.settings.compact;
  els.titleToggle.checked = state.settings.autoTitle;
  els.toneSelect.value = state.settings.tone;
}

function renderTopbarActions() {
  const chat = currentChat();
  const hasStarted = Boolean(chat?.messages?.length);
  const isTemporary = Boolean(chat?.temporary);

  els.temporaryChatButton.hidden = hasStarted && !isTemporary;
  els.shareButton.hidden = !hasStarted || isTemporary;
  els.topChatMenuButton.hidden = !hasStarted || isTemporary;
  els.temporaryChatButton.classList.toggle("is-active", isTemporary);

  if (els.topMenuPinLabel && chat) {
    els.topMenuPinLabel.textContent = chat.pinned ? "إلغاء التثبيت" : "تثبيت المحادثة";
  }
}

function render() {
  renderSettings();
  renderTopbarActions();
  renderSidebar();
  renderMessages();
  renderAttachments();
  renderTools();
}

