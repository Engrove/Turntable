<!-- src/components/ResultsTable.vue -->
<template>
  <div class="table-container">
    <table>
      <!-- ... (thead-sektionen är oförändrad) ... -->
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key" @click="header.sortable && $emit('sort', header.key)" :class="{ sortable: header.sortable, active: sortKey === header.key }">
            {{ header.label }}
            <span v-if="sortKey === header.key" class="sort-arrow">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0">
          <td :colspan="headers.length" class="no-results">No items match your current search and filters.</td>
        </tr>
        <!-- NY LOGIK: @click-event och .clickable klass -->
        <tr v-for="item in items" :key="item.id" @click="$emit('row-click', item)" class="clickable">
          <td v-for="header in headers" :key="header.key" :data-label="header.label">
            {{ formatValue(item, header.key) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  headers: { type: Array, required: true },
  sortKey: { type: String, default: '' },
  sortOrder: { type: String, default: 'asc' }
});
// NY LOGIK: Lägg till emit för row-click
defineEmits(['sort', 'row-click']);

function formatValue(item, key) { /* ... (oförändrad) ... */
  const value = item[key];
  if (value === null || value === undefined) return '-';
  if (key === 'headshell_connector' && typeof value === 'string') {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return value;
}
</script>

<style scoped>
/* ... (all befintlig css är densamma) ... */
.table-container { overflow-x: auto; width: 100%; border: 1px solid var(--border-color); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; background-color: #fff; }
th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
thead tr { background-color: var(--panel-bg); }
th { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--label-color); position: relative; }
th.sortable { cursor: pointer; }
th.sortable:hover { color: var(--header-color); }
th.active { color: var(--accent-color); }
.sort-arrow { font-size: 0.7rem; margin-left: 4px; }
tbody tr:last-child td { border-bottom: none; }
/* NY CSS */
tbody tr.clickable:hover {
  background-color: #e9ecef;
  cursor: pointer;
}
.no-results { text-align: center; padding: 3rem; color: var(--label-color); font-style: italic; }
@media (max-width: 768px) { /* ... (oförändrad) ... */ }
</style>
