const commandInput = document.getElementById('command-input');
const navBack = document.getElementById('nav-back');
const navForward = document.getElementById('nav-forward');
const navReload = document.getElementById('nav-reload');
const themeToggle = document.getElementById('theme-toggle');

const THEME_STORAGE_KEY = 'arc-lite-theme';

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
}

window.arcBridge?.onStateChange(updateState);
restoreTheme();

themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});
