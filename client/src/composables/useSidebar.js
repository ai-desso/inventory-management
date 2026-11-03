import { ref, computed } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'
// Keep in sync with the 900px media query in App.vue (custom properties cannot be used in media queries).
const SMALL_QUERY = '(max-width: 900px)'

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch (err) {
    console.error('Failed to read sidebar preference:', err)
    return false
  }
}

// Saved preference; only changed by the toggle on wide screens.
const preferCollapsed = ref(readStored())
// Transient, never persisted: small screens are always icons-only unless the user opens the overlay.
const overlayOpen = ref(false)

const mediaQuery = window.matchMedia(SMALL_QUERY)
const isSmallScreen = ref(mediaQuery.matches)
mediaQuery.addEventListener('change', (event) => {
  isSmallScreen.value = event.matches
  overlayOpen.value = false
})

const persist = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch (err) {
    console.error('Failed to persist sidebar preference:', err)
  }
}

export function useSidebar() {
  const isCollapsed = computed(() => (isSmallScreen.value ? !overlayOpen.value : preferCollapsed.value))

  const toggleSidebar = () => {
    if (isSmallScreen.value) {
      overlayOpen.value = !overlayOpen.value
      return
    }
    preferCollapsed.value = !preferCollapsed.value
    persist(preferCollapsed.value)
  }

  const closeOverlay = () => {
    overlayOpen.value = false
  }

  return { isCollapsed, isSmallScreen, toggleSidebar, closeOverlay }
}
