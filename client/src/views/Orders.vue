<template>
  <div class="orders">
    <div class="page-header">
      <h2>{{ t('orders.title') }}</h2>
      <p>{{ t('orders.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-label">{{ t('status.delivered') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Delivered').length }}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">{{ t('status.shipped') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Shipped').length }}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">{{ t('status.processing') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Processing').length }}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">{{ t('status.backordered') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Backordered').length }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('orders.allOrders') }} ({{ orders.length }})</h3>
        </div>
        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th class="col-order-number">{{ t('orders.table.orderNumber') }}</th>
                <th class="col-customer">{{ t('orders.table.customer') }}</th>
                <th class="col-items">{{ t('orders.table.items') }}</th>
                <th class="col-status">{{ t('orders.table.status') }}</th>
                <th class="col-date">{{ t('orders.table.orderDate') }}</th>
                <th class="col-date">{{ t('orders.table.expectedDelivery') }}</th>
                <th class="col-value">{{ t('orders.table.totalValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td class="col-order-number"><strong>{{ order.order_number }}</strong></td>
                <td class="col-customer">{{ translateCustomerName(order.customer) }}</td>
                <td class="col-items">
                  <details class="items-details">
                    <summary class="items-summary">
                      {{ t('orders.itemsCount', { count: order.items.length }) }}
                    </summary>
                    <div class="items-dropdown">
                      <div v-for="(item, idx) in order.items" :key="idx" class="item-entry">
                        <span class="item-name">{{ translateProductName(item.name) }}</span>
                        <span class="item-meta">{{ t('orders.quantity') }}: {{ item.quantity }} @ {{ currencySymbol }}{{ item.unit_price }}</span>
                      </div>
                    </div>
                  </details>
                </td>
                <td class="col-status">
                  <span :class="['badge', getOrderStatusClass(order.status)]">
                    {{ t(`status.${order.status.toLowerCase()}`) }}
                  </span>
                </td>
                <td class="col-date">{{ formatDate(order.order_date) }}</td>
                <td class="col-date">{{ formatDate(order.expected_delivery) }}</td>
                <td class="col-value"><strong>{{ currencySymbol }}{{ order.total_value.toLocaleString() }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'Orders',
  setup() {
    const { t, currentCurrency, translateProductName, translateCustomerName } = useI18n()

    const currencySymbol = computed(() => {
      return currentCurrency.value === 'JPY' ? '¥' : '$'
    })
    const loading = ref(true)
    const error = ref(null)
    const orders = ref([])

    // Use shared filters
    const {
      selectedPeriod,
      selectedLocation,
      selectedCategory,
      selectedStatus,
      getCurrentFilters
    } = useFilters()

    const loadOrders = async () => {
      try {
        loading.value = true
        const filters = getCurrentFilters()
        const fetchedOrders = await api.getOrders(filters)

        // Sort orders by order_date (earliest first)
        orders.value = fetchedOrders.sort((a, b) => {
          const dateA = new Date(a.order_date)
          const dateB = new Date(b.order_date)
          return dateA - dateB
        })
      } catch (err) {
        error.value = 'Failed to load orders: ' + err.message
      } finally {
        loading.value = false
      }
    }

    // Watch for filter changes and reload data
    watch([selectedPeriod, selectedLocation, selectedCategory, selectedStatus], () => {
      loadOrders()
    })

    const getOrdersByStatus = (status) => {
      return orders.value.filter(order => order.status === status)
    }

    const getOrderStatusClass = (status) => {
      const statusMap = {
        'Delivered': 'success',
        'Shipped': 'info',
        'Processing': 'warning',
        'Backordered': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const formatDate = (dateString) => {
      const { currentLocale } = useI18n()
      const locale = currentLocale.value === 'ja' ? 'ja-JP' : 'en-US'
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    onMounted(loadOrders)

    return {
      t,
      loading,
      error,
      orders,
      getOrdersByStatus,
      getOrderStatusClass,
      formatDate,
      currencySymbol,
      translateProductName,
      translateCustomerName
    }
  }
}
</script>

<style scoped>
/* Page header, loading and error use the shared global styles. */

/* Four status tiles stay on one row while they fit, then wrap (global minimum is 280px). */
.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
}

.stat-card {
  box-shadow: var(--shadow-sm);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
}

/* The card owns no padding: header and table bleed to the edges so rows and dividers line up. */
.card {
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.card-header {
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  margin: 0;
}

/* Fixed layout keeps columns from shifting; percentage widths plus a minimum table width
   make the container scroll horizontally instead of crushing the columns. */
.orders-table {
  table-layout: fixed;
  width: 100%;
  min-width: 1000px;
}

.orders-table thead {
  background: var(--color-surface-muted);
}

.orders-table th,
.orders-table td {
  padding: var(--space-3) var(--space-4);
  vertical-align: middle;
}

.orders-table th:first-child,
.orders-table td:first-child {
  padding-left: var(--space-5);
}

.orders-table th:last-child,
.orders-table td:last-child {
  padding-right: var(--space-5);
}

.col-order-number {
  width: 15%;
  white-space: nowrap;
}

.col-customer {
  width: 18%;
}

.col-items {
  width: 13%;
}

.col-status {
  width: 15%;
}

.col-date {
  width: 12%;
}

.col-value {
  width: 15%;
  text-align: right;
}

.badge {
  white-space: nowrap;
}

/* Items details */
.items-details {
  position: relative;
}

.items-summary {
  cursor: pointer;
  color: var(--color-primary-text);
  font-weight: 500;
  list-style: none;
  user-select: none;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm);
}

.items-summary::-webkit-details-marker {
  display: none;
}

/* CSS triangle instead of a text glyph, which can render as an emoji on some platforms. */
.items-summary::before {
  content: '';
  flex-shrink: 0;
  margin-right: var(--space-2);
  border-style: solid;
  border-width: 4px 0 4px 6px;
  border-color: transparent transparent transparent currentColor;
  transition: transform var(--transition-base);
}

.items-details[open] .items-summary::before {
  transform: rotate(90deg);
}

.items-summary:hover {
  text-decoration: underline;
}

.items-summary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Popover: surface, border and shadow tokens so it follows the dark theme. */
.items-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-2);
  z-index: var(--z-sticky);
  min-width: min(300px, 70vw);
  max-width: min(400px, 90vw);
}

.item-entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.item-entry:last-child {
  border-bottom: none;
}

.item-name {
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--color-heading);
}

.item-meta {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

/* Icon-rail width: the table scrolls sideways, so an absolute popover would be clipped by the
   scroll container. Expand the item list inline instead. */
@media (max-width: 900px) {
  .items-dropdown {
    position: static;
    min-width: 0;
    max-width: none;
    box-shadow: none;
    background: var(--color-surface-muted);
  }

  /* --color-muted fails AA on --color-surface-muted in light mode. */
  .item-meta {
    color: var(--color-text-secondary);
  }

  .stat-card {
    padding: var(--space-4);
  }
}
</style>
