<template>
  <div class="app">
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-brand">
        <svg
          class="sidebar-brand-mark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2l9 5v10l-9 5-9-5V7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <div class="sidebar-brand-text sidebar-label">
          <h1 class="sidebar-brand-title">{{ t('nav.companyName') }}</h1>
          <span class="sidebar-brand-subtitle">{{ t('nav.subtitle') }}</span>
        </div>
        <button
          type="button"
          class="sidebar-toggle"
          :aria-label="t('nav.toggleSidebar')"
          :title="t('nav.toggleSidebar')"
          :aria-expanded="String(!isCollapsed)"
          aria-controls="sidebar-nav"
          @click="toggleSidebar"
        >
          <svg
            class="sidebar-toggle-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <nav id="sidebar-nav" class="sidebar-nav" :aria-label="t('nav.menu')" @click="closeOverlay">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :title="isCollapsed ? item.label : null"
          class="sidebar-link"
          active-class="is-active"
        >
          <svg
            class="sidebar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            v-html="item.icon"
          />
          <span class="sidebar-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button
          type="button"
          class="sidebar-link sidebar-theme-toggle"
          :aria-label="themeToggleLabel"
          :title="isCollapsed ? themeToggleLabel : null"
          @click="toggleTheme"
        >
          <svg
            v-if="isDark"
            class="sidebar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <svg
            v-else
            class="sidebar-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          <span class="sidebar-label">{{ themeToggleLabel }}</span>
        </button>
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </div>
    </aside>

    <div class="app-content">
      <FilterBar />
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import { useSidebar } from './composables/useSidebar'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

// Inner SVG markup (24x24 viewBox, stroked with currentColor). Static, trusted strings.
const NAV_ICONS = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  inventory: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3.3 7.5L12 12.5l8.7-5"/><path d="M12 22V12.5"/>',
  orders: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6"/>',
  finance: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  demand: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 9h2M8 13h8M8 17h8"/>'
}

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const { isDark, toggleTheme } = useTheme()
    const { isCollapsed, toggleSidebar, closeOverlay } = useSidebar()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Single nav source; labels go through t() so they follow the locale.
    const navItems = computed(() => [
      { to: '/', label: t('nav.overview'), icon: NAV_ICONS.overview },
      { to: '/inventory', label: t('nav.inventory'), icon: NAV_ICONS.inventory },
      { to: '/orders', label: t('nav.orders'), icon: NAV_ICONS.orders },
      { to: '/spending', label: t('nav.finance'), icon: NAV_ICONS.finance },
      { to: '/demand', label: t('nav.demandForecast'), icon: NAV_ICONS.demand },
      { to: '/reports', label: t('nav.reports'), icon: NAV_ICONS.reports }
    ])

    // Label names the mode the button switches to.
    const themeToggleLabel = computed(() => (isDark.value ? t('nav.lightMode') : t('nav.darkMode')))

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      navItems,
      isDark,
      toggleTheme,
      themeToggleLabel,
      isCollapsed,
      toggleSidebar,
      closeOverlay,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Shell layout: sidebar column + content column. Neither creates a stacking context
   beyond the sidebar's own, so the modals (z 1000-2000) rendered as siblings cover it. */
.app {
  display: flex;
  min-height: 100vh;
}

.app-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-5) var(--space-6);
}

/* Sidebar. No overflow on the sidebar itself: the footer dropdowns open to its right and would be clipped.
   Only the nav scrolls. */
.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex-shrink: 0;
  width: var(--sidebar-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: var(--z-sidebar);
  transition: width var(--transition-base);
}

.sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-brand-mark {
  width: 32px;
  height: 32px;
  padding: var(--space-1);
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  color: var(--color-on-primary);
}

.sidebar-brand-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
}

.sidebar-brand-title {
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-heading);
  letter-spacing: -0.025em;
}

.sidebar-brand-subtitle {
  margin-top: var(--space-0);
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-6);
  height: var(--space-6);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-muted);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.sidebar-toggle:hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border-strong);
  color: var(--color-heading);
}

.sidebar-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.sidebar-toggle-icon {
  width: var(--space-4);
  height: var(--space-4);
  transition: transform var(--transition-base);
}

.sidebar.is-collapsed .sidebar-toggle-icon {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
  overflow-y: auto;
}

.sidebar-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-muted);
  font-family: inherit;
  font-size: var(--text-md);
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  /* Clips the label while the width animates so it does not spill past the sidebar edge. */
  overflow: hidden;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sidebar-link:hover {
  background: var(--color-surface-muted);
  color: var(--color-heading);
}

.sidebar-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.sidebar-link.is-active {
  background: var(--color-primary-soft);
  color: var(--color-primary-text);
  font-weight: 600;
}

.sidebar-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
}

/* Icons-only mode (.is-collapsed, driven by useSidebar: saved preference on wide screens, forced below 900px).
   Labels are visually hidden, not display:none, so controls keep their accessible name.
   Also used by ProfileMenu and LanguageSwitcher for their text and chevrons. */
.sidebar.is-collapsed .sidebar-brand {
  flex-direction: column;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
}

.sidebar.is-collapsed .sidebar-nav {
  padding: var(--space-3) var(--space-2);
}

.sidebar.is-collapsed .sidebar-footer {
  padding: var(--space-2);
}

.sidebar.is-collapsed .sidebar-link {
  justify-content: center;
  padding: var(--space-3) var(--space-2);
}

.sidebar.is-collapsed .profile-button,
.sidebar.is-collapsed .language-button {
  justify-content: center;
  padding: var(--space-2);
}

.sidebar.is-collapsed .sidebar-label {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

/* Narrow viewports: the sidebar leaves the flow and the content column reserves the icon rail's width.
   Expanding it (toggle) then overlays the content instead of squeezing it. Must match SMALL_QUERY in useSidebar.js. */
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
  }

  .sidebar:not(.is-collapsed) {
    box-shadow: var(--shadow-lg);
  }

  .app-content {
    margin-left: var(--sidebar-width-collapsed);
  }

  .main-content {
    padding: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-toggle-icon {
    transition: none;
  }
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h2 {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: var(--space-2);
  letter-spacing: -0.025em;
}

.page-header p {
  color: var(--color-muted);
  font-size: var(--text-base);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4-5);
  margin-bottom: var(--space-5);
}

.stat-card {
  background: var(--color-surface);
  padding: var(--space-4-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.stat-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.stat-label {
  color: var(--color-muted);
  font-size: var(--text-md);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.025em;
}

.stat-card.warning .stat-value {
  color: var(--color-warning);
}

.stat-card.success .stat-value {
  color: var(--color-success);
}

.stat-card.danger .stat-value {
  color: var(--color-danger);
}

.stat-card.info .stat-value {
  color: var(--color-primary-text);
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-4-5);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-4-5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.025em;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: var(--text-md);
}

tbody tr {
  transition: background-color var(--transition-fast);
}

tbody tr:hover {
  background: var(--color-bg);
}

.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success,
.badge.increasing {
  background: var(--color-success-soft);
  color: var(--color-success-strong);
}

.badge.warning,
.badge.medium {
  background: var(--color-warning-soft);
  color: var(--color-warning-strong);
}

.badge.danger,
.badge.decreasing,
.badge.high {
  background: var(--color-danger-soft);
  color: var(--color-danger-strong);
}

.badge.info,
.badge.low {
  background: var(--color-info-soft);
  color: var(--color-info-strong);
}

.badge.stable {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.loading {
  text-align: center;
  padding: var(--space-7);
  color: var(--color-muted);
  font-size: var(--text-base);
}

.error {
  background: var(--color-danger-subtle);
  border: 1px solid var(--color-danger-soft);
  color: var(--color-danger-strong);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin: var(--space-4) 0;
  font-size: var(--text-base);
}
</style>
