// src/store/reportStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useReportStore = defineStore('report', () => {
  // En state-egenskap för att hålla datan för den rapport som ska genereras.
  const reportData = ref(null);

  // En action för att sätta datan från kalkylatorn/estimatorn.
  function setReportData(data) {
    reportData.value = data;
  }

  // En action för att rensa datan efter att rapporten har visats (god praxis).
  function clearReportData() {
    reportData.value = null;
  }

  return {
    reportData,
    setReportData,
    clearReportData
  };
});
