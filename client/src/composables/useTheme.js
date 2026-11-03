import { ref, computed } from 'vue'

// Same key as the inline script in index.html, which sets data-theme before first paint.
const STORAGE_KEY = 'app-theme'

// Read the attribute the inline script already set so state and DOM start in sync.
const theme = ref(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')

const applyTheme = (value) => {
  theme.value = value
  document.documentElement.setAttribute('data-theme', value)
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch (err) {
    console.error('Failed to persist theme:', err)
  }
}

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')
  const toggleTheme = () => applyTheme(isDark.value ? 'light' : 'dark')

  return { theme, isDark, toggleTheme }
}
