// src/store/reportStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useReportStore = defineStore('report', () => {
  const reportData = ref(null);

  function setReportData(data) {
    reportData.value = data;
  }

  function clearReportData() {
    reportData.value = null;
  }

  return {
    reportData,
    setReportData,
    clearReportData
  };
}, {
  // Aktivera beständighet för denna store. Datan sparas i sessionStorage.
  persist: true, 
});
