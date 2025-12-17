const commandInput = document.getElementById('command-input');
const navBack = document.getElementById('nav-back');
const navForward = document.getElementById('nav-forward');
const navReload = document.getElementById('nav-reload');
const themeToggle = document.getElementById('theme-toggle');
const workspaceList = document.getElementById('workspace-list');
const tabList = document.getElementById('tab-list');
const pinnedList = document.getElementById('pinned-list');

const THEME_STORAGE_KEY = 'arc-lite-theme';

const workspaces = [
  {
    id: 'main',
    name: 'メイン',
    pinned: [
      { title: 'Docs', url: 'https://developer.chrome.com/docs/' },
      { title: 'メール', url: 'https://mail.google.com' }
    ],
    tabs: [
      { id: 'getting-started', title: 'Getting Started', url: 'https://example.com' },
      { id: 'design-notes', title: '設計メモ', url: 'https://www.electronjs.org/docs/latest/' },
      { id: 'issues', title: 'Issue Tracker', url: 'https://github.com/electron/electron/issues' }
    ]
  },
  {
    id: 'dev',
    name: '開発',
    pinned: [
      { title: 'API リファレンス', url: 'https://www.electronjs.org/docs/latest/api/' }
    ],
    tabs: [
      { id: 'devtools', title: 'DevTools Tips', url: 'https://developer.mozilla.org/en-US/docs/Tools' }
    ]
  },
  {
    id: 'research',
    name: '調査',
    pinned: [],
    tabs: [
      { id: 'search', title: '検索', url: 'https://www.google.com' }
    ]
  }
];

let activeWorkspaceId = workspaces[0].id;
let activeTabId = workspaces[0].tabs[0].id;

function getActiveWorkspace() {
  return workspaces.find((ws) => ws.id === activeWorkspaceId);
}

function getActiveTab() {
  const workspace = getActiveWorkspace();
  return workspace?.tabs.find((tab) => tab.id === activeTabId);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.arcBridge?.setTheme(theme);
}

function restoreTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  applyTheme(saved);
}

commandInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && commandInput.value.trim()) {
    const workspace = getActiveWorkspace();
    if (workspace) {
      const activeTab = getActiveTab();
      if (activeTab) {
        activeTab.url = commandInput.value.trim();
      } else {
        const newTabId = `tab-${Date.now()}`;
        workspace.tabs.unshift({
          id: newTabId,
          title: commandInput.value.trim(),
          url: commandInput.value.trim()
        });
        activeTabId = newTabId;
      }
      renderTabs();
    }

    window.arcBridge?.loadUrl(commandInput.value.trim());
  }
});

navBack?.addEventListener('click', () => window.arcBridge?.navigate('back'));
navForward?.addEventListener('click', () => window.arcBridge?.navigate('forward'));
navReload?.addEventListener('click', () => window.arcBridge?.navigate('reload'));

function updateState(state) {
  if (!state) return;
  if (state.url) {
    commandInput.value = state.url;
  }
  navBack.disabled = !state.canGoBack;
  navForward.disabled = !state.canGoForward;
  document.title = state.title ? `${state.title} · Arc Lite` : 'Arc Lite';

  const activeTab = getActiveTab();
  if (activeTab) {
    activeTab.url = state.url;
    if (state.title) activeTab.title = state.title;
    renderTabs();
  }
}

window.arcBridge?.onStateChange(updateState);
restoreTheme();

themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});

function loadActiveTab() {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  commandInput.value = activeTab.url;
  window.arcBridge?.loadUrl(activeTab.url);
}

function setActiveWorkspace(workspaceId) {
  const workspace = workspaces.find((ws) => ws.id === workspaceId);
  if (!workspace) return;
  activeWorkspaceId = workspaceId;
  if (!workspace.tabs.find((tab) => tab.id === activeTabId)) {
    activeTabId = workspace.tabs[0]?.id ?? null;
  }

  renderWorkspaces();
  renderPinned();
  renderTabs();
  loadActiveTab();
}

function renderWorkspaces() {
  if (!workspaceList) return;
  workspaceList.innerHTML = '';
  workspaces.forEach((workspace) => {
    const button = document.createElement('button');
    button.className = `pill${workspace.id === activeWorkspaceId ? ' is-active' : ''}`;
    button.textContent = workspace.name;
    button.addEventListener('click', () => setActiveWorkspace(workspace.id));
    workspaceList.appendChild(button);
  });
}

function renderTabs() {
  const workspace = getActiveWorkspace();
  if (!workspace || !tabList) return;
  tabList.innerHTML = '';
  workspace.tabs.forEach((tab) => {
    const li = document.createElement('li');
    li.textContent = tab.title;
    if (tab.id === activeTabId) {
      li.classList.add('active');
    }
    li.addEventListener('click', () => {
      activeTabId = tab.id;
      renderTabs();
      loadActiveTab();
    });
    tabList.appendChild(li);
  });
}

function renderPinned() {
  const workspace = getActiveWorkspace();
  if (!workspace || !pinnedList) return;
  pinnedList.innerHTML = '';
  workspace.pinned.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item.title;
    li.addEventListener('click', () => {
      const activeTab = getActiveTab();
      if (activeTab) {
        activeTab.title = item.title;
        activeTab.url = item.url;
        renderTabs();
      }
      commandInput.value = item.url;
      window.arcBridge?.loadUrl(item.url);
    });
    pinnedList.appendChild(li);
  });
}

renderWorkspaces();
renderPinned();
renderTabs();
loadActiveTab();
