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

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function syncChatViewState() {
  const chat = currentChat();
  const isEmpty = !chat?.messages?.length;

  els.promptInput.placeholder = isEmpty ? "اكتب اللي حاسس بيه" : "كمل...";
  els.emptyState.hidden = !isEmpty;
  els.chatView.classList.toggle("is-empty", isEmpty);
  els.chatView.classList.remove("has-draft");
}

function setSendButtonMode(hasPromptText) {
  const icon = hasPromptText ? "arrow-up" : "audio-lines";
  if (els.sendButton.dataset.icon === icon) return;

  els.sendButton.dataset.icon = icon;
  els.sendButton.innerHTML = `<i data-lucide="${icon}"></i>`;
  els.sendButton.setAttribute("aria-label", hasPromptText ? "إرسال الرسالة" : "إدخال صوتي");
  els.sendButton.setAttribute("title", hasPromptText ? "إرسال الرسالة" : "إدخال صوتي");
  refreshIcons();
}

function syncPromptInput() {
  setSendButtonMode(els.promptInput.value.trim().length > 0);
  syncChatViewState();
  els.promptInput.style.height = "auto";
  els.promptInput.style.height = `${Math.min(120, els.promptInput.scrollHeight)}px`;
}

function scrollToBottom() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      els.messageScroll.scrollTop = els.messageScroll.scrollHeight;
    });
  });
}

function focusPrompt() {
  window.setTimeout(() => els.promptInput.focus(), 0);
}

function openDropdown(menu, trigger) {
  closeDropdowns(menu);
  menu.classList.toggle("is-open");
  trigger?.setAttribute("aria-expanded", String(menu.classList.contains("is-open")));
}

function closeDropdowns(except) {
  document.querySelectorAll(".dropdown.is-open, .composer-plus-menu.is-open").forEach((menu) => {
    if (menu !== except) menu.classList.remove("is-open");
  });
  document.querySelectorAll("[aria-expanded='true']").forEach((button) => {
    const targetOpen =
      button === els.attachButton && els.toolsMenu === except;
    if (!targetOpen) button.setAttribute("aria-expanded", "false");
  });
}

function openSheet(sheet) {
  closeDropdowns();
  closeConversationMenu();
  closeTopChatMenu();
  sheet.hidden = false;
}

function closeSheets() {
  document.querySelectorAll(".sheet").forEach((sheet) => {
    sheet.hidden = true;
  });
}

function openConversationMenu(chatId, trigger) {
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat || !els.conversationMenu) return;

  closeDropdowns();
  activeConversationMenuChatId = chatId;
  if (els.menuPinLabel) {
    els.menuPinLabel.textContent = chat.pinned ? "إلغاء التثبيت" : "تثبيت المحادثة";
  }

  els.conversationMenu.hidden = false;
  refreshIcons();

  const triggerRect = trigger.getBoundingClientRect();
  const menuRect = els.conversationMenu.getBoundingClientRect();
  const gap = 8;
  const top = Math.max(
    gap,
    Math.min(triggerRect.bottom + gap, window.innerHeight - menuRect.height - gap),
  );
  const left = Math.max(
    gap,
    Math.min(triggerRect.right - menuRect.width, window.innerWidth - menuRect.width - gap),
  );

  els.conversationMenu.style.top = `${top}px`;
  els.conversationMenu.style.left = `${left}px`;
}

function closeConversationMenu() {
  if (!els.conversationMenu) return;
  els.conversationMenu.hidden = true;
  activeConversationMenuChatId = null;
}

function openAnchoredMenu(menu, trigger) {
  if (!menu || !trigger) return;
  closeDropdowns();
  closeConversationMenu();
  menu.hidden = false;
  refreshIcons();

  const triggerRect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const gap = 8;
  const top = Math.max(
    gap,
    Math.min(triggerRect.bottom + gap, window.innerHeight - menuRect.height - gap),
  );
  const left = Math.max(
    gap,
    Math.min(triggerRect.right - menuRect.width, window.innerWidth - menuRect.width - gap),
  );

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function closeTopChatMenu() {
  if (!els.topChatMenu) return;
  els.topChatMenu.hidden = true;
}

function handleConversationMenuAction(action) {
  const chatId = activeConversationMenuChatId;
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat) return;

  closeConversationMenu();

  if (action === "share") {
    showToast("المشاركة قريبًا");
    return;
  }

  if (action === "group") {
    showToast("محادثة جماعية قريبًا");
    return;
  }

  if (action === "rename") {
    renameChat(chatId);
    return;
  }

  if (action === "pin") {
    pinChat(chatId);
    return;
  }

  if (action === "archive") {
    showToast("الأرشفة غير مفعلة في النسخة المحلية");
    return;
  }

  if (action === "delete" && window.confirm("حذف المحادثة؟")) {
    deleteChat(chatId);
  }
}

function handleTopChatMenuAction(action) {
  const chat = currentChat();
  if (!chat) return;

  closeTopChatMenu();

  if (action === "group") {
    showToast("محادثة جماعية قريبًا");
    return;
  }

  if (action === "files") {
    showToast("عرض الملفات قريبًا");
    return;
  }

  if (action === "pin") {
    pinChat(chat.id);
    return;
  }

  if (action === "archive") {
    showToast("الأرشفة قريبًا");
    return;
  }

  if (action === "delete" && window.confirm("حذف المحادثة؟")) {
    deleteChat(chat.id);
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkify(value) {
  return value.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>',
  );
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function setView(view) {
  els.chatView.hidden = view !== "chat";
  document.querySelectorAll(".quick-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  if (view === "chat") focusPrompt();
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast("تم النسخ"));
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  showToast("تم النسخ");
}

function speakText(text) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    showToast("تشغيل الصوت غير مدعوم في المتصفح");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-EG";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
  showToast("تشغيل الصوت");
}

function exportChats() {
  const blob = new Blob([JSON.stringify(state.chats, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nova-arabic-chats.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("تم تجهيز التصدير");
}

function wireEvents() {
  els.projectTitleButton.addEventListener("click", () => {
    if (els.app.dataset.sidebar === "closed") {
      els.app.dataset.sidebar = "open";
    }
  });

  els.sidebarToggle.addEventListener("click", () => {
    els.app.dataset.sidebar = els.app.dataset.sidebar === "closed" ? "open" : "closed";
  });

  els.mobileSidebarToggle.addEventListener("click", () => {
    els.app.dataset.sidebar = "open";
  });

  els.newChatButton.addEventListener("click", createChat);

  els.searchButton.addEventListener("click", () => {
    openSheet(els.searchSheet);
    renderSearchResults();
    window.setTimeout(() => els.chatSearch.focus(), 0);
  });

  els.railPinnedButton.addEventListener("click", () => {
    const pinned = state.chats.find((chat) => chat.pinned);
    if (!pinned) {
      showToast("لا توجد محادثات مثبتة");
      return;
    }
    discardTemporaryChats();
    state.currentChatId = pinned.id;
    saveState();
    render();
  });

  els.railChatButton.addEventListener("click", () => {
    els.app.dataset.sidebar = "open";
    setView("chat");
    focusPrompt();
  });

  els.chatSearch.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderSearchResults();
  });

  els.searchResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-search-chat]");
    if (!button) return;
    discardTemporaryChats();
    state.currentChatId = button.dataset.openSearchChat;
    saveState();
    setView("chat");
    render();
    closeSheets();
    if (window.matchMedia("(max-width: 860px)").matches) els.app.dataset.sidebar = "closed";
  });

  els.conversationGroups.addEventListener("click", (event) => {
    if (event.target.closest("[data-rename-input]")) return;

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      event.stopPropagation();
      const chatId = actionButton.dataset.chatId;
      const action = actionButton.dataset.action;
      if (action === "menu") openConversationMenu(chatId, actionButton);
      return;
    }

    const chatButton = event.target.closest("[data-chat-id]");
    if (!chatButton) return;
    discardTemporaryChats();
    state.currentChatId = chatButton.dataset.chatId;
    saveState();
    setView("chat");
    render();
    if (window.matchMedia("(max-width: 860px)").matches) els.app.dataset.sidebar = "closed";
  });

  els.conversationGroups.addEventListener("input", (event) => {
    const input = event.target.closest("[data-rename-input]");
    if (!input) return;
    const chat = state.chats.find((item) => item.id === input.dataset.renameInput);
    if (!chat) return;
    chat.title = input.value.slice(0, 80);
    chat.updatedAt = Date.now();
    saveState();
  });

  els.conversationGroups.addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-rename-input]");
    if (!input) return;

    if (event.key === "Enter") {
      event.preventDefault();
      finishInlineRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finishInlineRename({ revert: true });
    }
  });

  els.conversationGroups.addEventListener("focusout", (event) => {
    const input = event.target.closest("[data-rename-input]");
    if (!input) return;
    window.setTimeout(() => {
      if (editingChatId === input.dataset.renameInput) {
        finishInlineRename();
      }
    }, 0);
  });

  els.conversationMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-menu-action]");
    if (!button) return;
    handleConversationMenuAction(button.dataset.menuAction);
  });

  document.querySelectorAll(".quick-link").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
      if (window.matchMedia("(max-width: 860px)").matches) els.app.dataset.sidebar = "closed";
    });
  });

  els.attachButton.addEventListener("click", () => openDropdown(els.toolsMenu, els.attachButton));
  els.temporaryChatButton.addEventListener("click", makeTemporaryChat);
  els.topChatMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openAnchoredMenu(els.topChatMenu, els.topChatMenuButton);
  });

  els.topChatMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-top-menu-action]");
    if (!button) return;
    handleTopChatMenuAction(button.dataset.topMenuAction);
  });

  els.toolsMenu.addEventListener("click", (event) => {
    const plusButton = event.target.closest("[data-plus-action]");
    if (plusButton) {
      const action = plusButton.dataset.plusAction;
      closeDropdowns();

      if (action === "attach") {
        els.fileInput.click();
        return;
      }

      const messages = {
        recent: "Recent files قريبًا",
        image: "Create image قريبًا",
        research: "Deep research قريبًا",
        web: "Web search قريبًا",
        more: "More قريبًا",
        projects: "Projects قريبًا",
      };
      showToast(messages[action] || "قريبًا");
      return;
    }

    const button = event.target.closest("[data-tool]");
    if (!button) return;
    const tool = button.dataset.tool;
    if (state.tools.has(tool)) state.tools.delete(tool);
    else state.tools.add(tool);
    saveState();
    renderTools();
  });

  els.promptInput.addEventListener("input", syncPromptInput);
  els.promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  });

  els.composer.addEventListener("submit", (event) => {
    event.preventDefault();
    submitPrompt();
  });

  els.suggestionGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-prompt]");
    if (button) submitPrompt(button.dataset.prompt);
  });

  els.fileInput.addEventListener("change", () => {
    state.attachments = [...state.attachments, ...Array.from(els.fileInput.files)];
    els.fileInput.value = "";
    renderAttachments();
    showToast("تم إرفاق الملفات");
  });

  els.attachmentRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-attachment]");
    if (!button) return;
    state.attachments.splice(Number(button.dataset.removeAttachment), 1);
    renderAttachments();
  });

  els.messages.addEventListener("click", (event) => {
    const button = event.target.closest("[data-message-action]");
    if (!button) return;
    const messageEl = event.target.closest("[data-message-id]");
    const chat = currentChat();
    const message = chat?.messages.find((item) => item.id === messageEl.dataset.messageId);
    if (!message) return;

    const action = button.dataset.messageAction;
    if (action === "copy") copyText(message.content);
    if (action === "speak") speakText(message.content);
    if (action === "edit") {
      els.promptInput.value = message.content;
      syncPromptInput();
      focusPrompt();
    }
    if (action === "retry") {
      if (message.role === "assistant") {
        const previousUser = [...chat.messages]
          .slice(0, chat.messages.indexOf(message))
          .reverse()
          .find((item) => item.role === "user");
        if (previousUser) simulateAssistant(previousUser.content);
      } else {
        simulateAssistant(message.content);
      }
    }
  });

  els.profileButton.addEventListener("click", () => openSheet(els.profileSheet));
  els.themeButton.addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveState();
    renderSettings();
    showToast("تم تغيير الثيم");
  });
  els.clearButton.addEventListener("click", () => {
    if (!window.confirm("مسح كل المحادثات؟")) return;
    state.chats = [];
    createChat();
    closeSheets();
  });
  els.exportButton.addEventListener("click", exportChats);

  els.compactToggle.addEventListener("change", () => {
    state.settings.compact = els.compactToggle.checked;
    saveState();
    renderSettings();
  });
  els.titleToggle.addEventListener("change", () => {
    state.settings.autoTitle = els.titleToggle.checked;
    saveState();
  });
  els.toneSelect.addEventListener("change", () => {
    state.settings.tone = els.toneSelect.value;
    saveState();
  });

  els.micButton.addEventListener("click", () => {
    showToast("الإدخال الصوتي جاهز كمكان مخصص");
  });

  els.shareButton.addEventListener("click", () => {
    const chat = currentChat();
    if (!chat || chat.temporary) {
      showToast("المشاركة غير متاحة للمحادثات المؤقتة");
      return;
    }
    copyText(JSON.stringify(chat, null, 2));
    showToast("تم نسخ بيانات المحادثة");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".composer-plus-wrap")) {
      closeDropdowns();
    }
    if (!event.target.closest(".conversation-menu") && !event.target.closest("[data-action='menu']")) {
      closeConversationMenu();
    }
    if (!event.target.closest("#topChatMenu") && !event.target.closest("#topChatMenuButton")) {
      closeTopChatMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdowns();
      closeConversationMenu();
      closeTopChatMenu();
      closeSheets();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSheet(els.searchSheet);
      renderSearchResults();
      window.setTimeout(() => els.chatSearch.focus(), 0);
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "o") {
      event.preventDefault();
      createChat();
    }
  });

  document.querySelectorAll("[data-close-sheet]").forEach((button) => {
    button.addEventListener("click", closeSheets);
  });

  document.querySelectorAll(".sheet").forEach((sheet) => {
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) closeSheets();
    });
  });
}

loadState();
wireEvents();
render();
syncPromptInput();
refreshIcons();
