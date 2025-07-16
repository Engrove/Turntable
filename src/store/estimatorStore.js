// src/store/estimatorStore.js
import { defineStore } from 'pinia';
import { fetchJsonData } from '@/services/dataLoader';

export const useEstimatorStore = defineStore('estimator', {
  state: () => ({
    userInput: {
      type: 'MM',
      cu_dynamic_100hz: null,
      cu_static: null,
      cantilever_class: null,
      stylus_family: null,
    },
    result: {
      compliance_min: null,
      compliance_median: null,
      compliance_max: null,
      confidence: 0,
      sampleSize: 0,
      description: 'Please enter data to begin.',
      chartConfig: null,
    },
    estimationRules: null,
    staticEstimationRules: null,
    allPickups: [],
    availableCantileverClasses: [],
    availableStylusFamilies: [],
    isLoading: true,
    error: null,
    debugLog: [],
  }),
  actions: {
    async initialize() {
      this.isLoading = true;
      this.error = null;
      this.debugLog = ['Initializing store...'];
      try {
        const [rules, staticRules, pickups, classifications] = await Promise.all([
          fetchJsonData('/data/estimation_rules.json'),
          fetchJsonData('/data/static_estimation_rules.json'),
          fetchJsonData('/data/pickup_data.json'),
          fetchJsonData('/data/classifications.json'),
        ]);

        this.debugLog.push('All JSON data fetched.');

        this.estimationRules = rules;
        this.staticEstimationRules = staticRules;
        this.allPickups = pickups;
        this.availableCantileverClasses = classifications.cantilever_class.categories.map(c => c.name);
        this.availableStylusFamilies = classifications.stylus_family.categories.map(c => c.name);
        
        this.debugLog.push('Store state populated successfully.');
        this.isLoading = false;

      } catch (err) {
        this.error = `Failed to load critical data: ${err.message}`;
        this.debugLog.push(`Error caught: ${err.message}`);
        this.isLoading = false;
      }
    },

    resetInput() {
      this.userInput = {
        type: 'MM',
        cu_dynamic_100hz: null,
        cu_static: null,
        cantilever_class: null,
        stylus_family: null,
      };
      this.calculateEstimate();
    },
    
    calculateEstimate() {
        if (this.userInput.cu_dynamic_100hz) {
            this.estimateFrom100Hz();
        } else if (this.userInput.cu_static) {
            this.estimateFromStatic();
        } else {
            this.result = {
                compliance_min: null,
                compliance_median: null,
                compliance_max: null,
                confidence: 0,
                sampleSize: 0,
                description: 'Please provide a 100Hz or Static compliance value to begin.',
                chartConfig: null
            };
        }
    },
    
    findBestRule(ruleset, userInput) {
      const { type, cantilever_class, stylus_family } = userInput;
      let bestRule = null;
      
      const checks = [
        r => r.priority === 1 && r.conditions.type === type && r.conditions.cantilever_class === cantilever_class && r.conditions.stylus_family === stylus_family,
        r => r.priority === 2 && r.conditions.type === type && r.conditions.cantilever_class === cantilever_class,
        r => r.priority === 3 && r.conditions.type === type,
      ];
      
      for (const check of checks) {
        bestRule = ruleset.segmented_rules.find(check);
        if (bestRule) break;
      }
      return bestRule || ruleset.global_fallback;
    },

    calculateConfidence(rule) {
        if (!rule) return 0;
        const priorityScore = (4 - rule.priority) * 10;
        const sampleScore = Math.min(20, (rule.sample_size / 20) * 20);
        const r2Score = (rule.r_squared || 0) * 25;
        const totalScore = Math.min(75, priorityScore + sampleScore + r2Score);
        return Math.round((totalScore / 75) * 100);
    },

    estimateFrom100Hz() {
      const rule = this.findBestRule(this.estimationRules, this.userInput);
      // *** KORRIGERING: Använder nu k och m istället för medianRatio ***
      const { k, m } = rule;
      const confidence = this.calculateConfidence(rule);
      const estimatedMedian = (this.userInput.cu_dynamic_100hz * k) + m;
      
      const uncertainty = (1 - (rule.r_squared || 0)) * 0.15;
      this.result = {
        compliance_median: estimatedMedian,
        compliance_min: estimatedMedian * (1 - uncertainty),
        compliance_max: estimatedMedian * (1 + uncertainty),
        confidence: confidence,
        sampleSize: rule.sample_size,
        // *** KORRIGERING: Uppdaterad beskrivning ***
        description: `Using a regression model for '${rule.conditions.type || 'All'}'. Formula: (100Hz Val × ${k.toFixed(3)}) + ${m.toFixed(3)}`,
        chartConfig: this.generateChartConfig(rule, this.estimationRules, '100Hz')
      };
    },

    estimateFromStatic() {
      const rule = this.findBestRule(this.staticEstimationRules, this.userInput);
      const { k, m } = rule;
      const confidence = this.calculateConfidence(rule);
      const estimatedMedian = (this.userInput.cu_static * k) + m;

      const uncertainty = (1 - (rule.r_squared || 0)) * 0.15;
      this.result = {
        compliance_median: estimatedMedian,
        compliance_min: estimatedMedian * (1 - uncertainty),
        compliance_max: estimatedMedian * (1 + uncertainty),
        confidence: confidence,
        sampleSize: rule.sample_size,
        description: `Using a regression model for '${rule.conditions.type || 'All'}'. Formula: (Static Comp. × ${k.toFixed(3)}) + ${m.toFixed(3)}`,
        chartConfig: this.generateChartConfig(rule, this.staticEstimationRules, 'static')
      };
    },
    
    generateChartConfig(rule, ruleset, type) {
        const xVar = type === '100Hz' ? 'cu_dynamic_100hz' : 'cu_static';
        const yVar = 'cu_dynamic_10hz';
        const conditions = rule.conditions;

        let dataPoints = this.allPickups.filter(p => p[xVar] && p[yVar]);
        if (conditions.type) dataPoints = dataPoints.filter(p => p.type === conditions.type);
        if (conditions.cantilever_class) dataPoints = dataPoints.filter(p => p.cantilever_class === conditions.cantilever_class);
        if (conditions.stylus_family) dataPoints = dataPoints.filter(p => p.stylus_family === conditions.stylus_family);

        const chartPoints = dataPoints.map(p => ({ x: p[xVar], y: p[yVar], model: `${p.manufacturer} ${p.model}` }));
        
        // *** KORRIGERING: Skickar alltid k och m nu ***
        return {
            dataPoints: chartPoints,
            labels: {
                x: type === '100Hz' ? 'Compliance @ 100Hz' : 'Static Compliance',
                y: 'Compliance @ 10Hz',
                title: type === '100Hz' ? '10Hz vs. 100Hz Compliance' : '10Hz vs. Static Compliance',
                lineLabel: `Trend Line (R²=${rule.r_squared.toFixed(2)})`
            },
            k: rule.k,
            m: rule.m
        };
    },

    getReportData() {
        return {
            type: 'estimator',
            userInput: { ...this.userInput },
            result: { ...this.result } 
        };
    },

  },
});
