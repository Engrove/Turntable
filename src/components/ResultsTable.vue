<!-- src/components/ResultsTable.vue -->
<template>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key">{{ header.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0">
          <td :colspan="headers.length" class="no-results">
            No items match your current search and filters.
          </td>
        </tr>
        <tr v-for="item in items" :key="item.id">
          <td v-for="header in headers" :key="header.key" :data-label="header.label">
            {{ formatValue(item, header.key) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  headers: {
    type: Array,
    required: true
  }
});

// En hjälpfunktion för att snygga till värdena, t.ex. ersätta "sme_universal" med "SME / Universal"
function formatValue(item, key) {
  const value = item[key];
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    // Ersätt understreck med mellanslag och gör första bokstaven stor
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return value;
}
</script>

<style scoped>
.table-container {
  overflow-x: auto;
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

thead tr {
  background-color: var(--panel-bg);
}

th {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--label-color);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: #f1f3f5;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--label-color);
  font-style: italic;
}

/* Responsiv tabell-styling för mobil */
@media (max-width: 768px) {
  thead { display: none; }
  tr { display: block; margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: 4px; }
  td { display: block; text-align: right; border-bottom: 1px dotted #ccc; }
  td:last-child { border-bottom: none; }
  td::before {
    content: attr(data-label);
    float: left;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.8rem;
    color: var(--header-color);
  }
}
</style>
