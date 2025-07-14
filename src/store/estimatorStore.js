// src/store/estimatorStore.js
import { defineStore } from 'pinia';

export const useEstimatorStore = defineStore('estimator', {
  state: () => ({
    userInput: {
      cu_dynamic_100hz: null,
      cu_static: null,
      type: null,
      cantilever_class: null,
      stylus_family: null,
      weight_g: null,
    },
    result: {
      compliance_min: null,
      compliance_median: null,
      compliance_max: null,
      confidence: 0,
      sampleSize: 0,
      description: 'Please provide a compliance value and a pickup type to begin.',
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
      this.debugLog = ['Initialization started.'];
      try {
        const [rulesResponse, staticRulesResponse, pickupsResponse, classificationsResponse] = await Promise.all([
          fetch('/data/estimation_rules.json'),
          fetch('/data/static_estimation_rules.json'),
          fetch('/data/pickup_data.json'),
          fetch('/data/classifications.json')
        ]);

        this.debugLog.push('All data files fetched.');

        if (!rulesResponse.ok) throw new Error(`Failed to load estimation_rules.json: ${rulesResponse.statusText}`);
        this.estimationRules = await rulesResponse.json();
        this.debugLog.push('Parsed estimation_rules.json.');

        if (!staticRulesResponse.ok) throw new Error(`Failed to load static_estimation_rules.json: ${staticRulesResponse.statusText}`);
        this.staticEstimationRules = await staticRulesResponse.json();
        this.debugLog.push('Parsed static_estimation_rules.json.');

        if (!pickupsResponse.ok) throw new Error(`Failed to load pickup_data.json: ${pickupsResponse.statusText}`);
        this.allPickups = await pickupsResponse.json();
        this.debugLog.push('Parsed pickup_data.json.');

        if (!classificationsResponse.ok) throw new Error(`Failed to load classifications.json: ${classificationsResponse.statusText}`);
        const classifications = await classificationsResponse.json();
        this.availableCantileverClasses = classifications.cantilever_class.categories.map(c => c.name);
        this.availableStylusFamilies = classifications.stylus_family.categories.map(c => c.name);
        this.debugLog.push('Parsed classifications.json and populated filters.');

        this.isLoading = false;
        this.debugLog.push('Initialization complete.');
      } catch (err) {
        console.error("Error during estimator initialization:", err);
        this.error = err.message;
        this.isLoading = false;
        this.debugLog.push(`Error caught: ${err.message}`);
      }
    },

    resetInput() {
      this.userInput = {
        cu_dynamic_100hz: null,
        cu_static: null,
        type: null,
        cantilever_class: null,
        stylus_family: null,
        weight_g: null,
      };
      this.result = {
        compliance_min: null,
        compliance_median: null,
        compliance_max: null,
        confidence: 0,
        sampleSize: 0,
        description: 'Please provide a compliance value and a pickup type to begin.',
        chartConfig: null,
      };
    },

    findBestRule() {
      const { type, cantilever_class, stylus_family } = this.userInput;
      const rules = this.estimationRules.segmented_rules;

      let bestRule = rules.find(r => r.conditions.type === type && r.conditions.cantilever_class === cantilever_class && r.conditions.stylus_family === stylus_family);
      if (bestRule) return bestRule;

      bestRule = rules.find(r => r.conditions.type === type && r.conditions.cantilever_class === cantilever_class && Object.keys(r.conditions).length === 2);
      if (bestRule) return bestRule;

      bestRule = rules.find(r => r.conditions.type === type && Object.keys(r.conditions).length === 1);
      if (bestRule) return bestRule;

      return this.estimationRules.global_fallback;
    },

    findBestStaticRule() {
      const { type, cantilever_class, stylus_family } = this.userInput;
      if (!this.staticEstimationRules) return null;
      const rules = this.staticEstimationRules.segmented_rules;

      let bestRule = rules.find(r => r.conditions.type === type && r.conditions.cantilever_class === cantilever_class && r.conditions.stylus_family === stylus_family);
      if (bestRule) return bestRule;

      bestRule = rules.find(r => r.conditions.type === type && r.conditions.cantilever_class === cantilever_class && Object.keys(r.conditions).length === 2);
      if (bestRule) return bestRule;

      bestRule = rules.find(r => r.conditions.type === type && Object.keys(r.conditions).length === 1);
      if (bestRule) return bestRule;

      return this.staticEstimationRules.global_fallback;
    },

    _calculateStaticConfidence(rule) {
      if (!rule) return 0;
      let totalPoints = 0;

      if (rule.priority === 1) totalPoints += 30;
      else if (rule.priority === 2) totalPoints += 20;
      else if (rule.priority === 3) totalPoints += 10;

      const size = rule.sample_size;
      if (size > 50) totalPoints += 20;
      else if (size > 20) totalPoints += 15;
      else if (size > 5) totalPoints += 10;
      else if (size >= 1) totalPoints += 5;

      const r2 = rule.r_squared;
      if (r2 > 0.70) totalPoints += 25;
      else if (r2 > 0.50) totalPoints += 15;
      else if (r2 > 0.25) totalPoints += 10;
      else totalPoints += 5;

      return Math.round((totalPoints / 75) * 100);
    },

    calculateEstimate() {
      if (!this.userInput.type) {
        this.result.description = 'Please select a pickup type to begin.';
        return;
      }

      if (this.userInput.cu_dynamic_100hz) {
        const rule = this.findBestRule();
        const ratio = rule.median_ratio;
        const estimatedValue = this.userInput.cu_dynamic_100hz * ratio;

        this.result.compliance_median = estimatedValue;
        this.result.compliance_min = estimatedValue * 0.9;
        this.result.compliance_max = estimatedValue * 1.1;
        this.result.confidence = Math.min(99, Math.round(rule.sample_size * 2.5));
        this.result.sampleSize = rule.sample_size;
        this.result.description = `Using a rule for ${Object.values(rule.conditions).join(', ')}. The median conversion ratio is ${ratio.toFixed(2)}.`;
        
        const dataPoints = this.allPickups.filter(p => p.cu_dynamic_100hz && p.cu_dynamic_10hz && Object.entries(rule.conditions).every(([key, value]) => p[key] === value))
                                           .map(p => ({ x: p.cu_dynamic_100hz, y: p.cu_dynamic_10hz, model: p.model }));
        
        this.result.chartConfig = {
          dataPoints,
          medianRatio: ratio,
          labels: {
            x: 'Compliance @ 100Hz',
            y: 'Compliance @ 10Hz',
            title: `10Hz vs 100Hz Compliance for ${Object.values(rule.conditions).join(' ')} Pickups`,
            lineLabel: `Median Ratio: ${ratio.toFixed(2)}x`
          }
        };

      } else if (this.userInput.cu_static) {
        const rule = this.findBestStaticRule();
        if (!rule) {
            this.result.description = "Static estimation rules could not be loaded. Please try again.";
            return;
        }
        
        const estimatedValue = (rule.k * this.userInput.cu_static) + rule.m;
        
        this.result.compliance_median = Math.max(1, estimatedValue);
        this.result.compliance_min = null;
        this.result.compliance_max = null;

        this.result.confidence = this._calculateStaticConfidence(rule);
        this.result.sampleSize = rule.sample_size;
        
        const conditionsText = Object.keys(rule.conditions).length > 0 ? Object.values(rule.conditions).join(', ') : 'All Types';
        this.result.description = `Using a regression model for '${conditionsText}'. Formula: (Static Compliance × ${rule.k.toFixed(3)}) + ${rule.m.toFixed(3)}.`;
        
        const dataPoints = this.allPickups.filter(p => p.cu_static && p.cu_dynamic_10hz && Object.entries(rule.conditions).every(([key, value]) => p[key] === value))
                                           .map(p => ({ x: p.cu_static, y: p.cu_dynamic_10hz, model: p.model }));

        this.result.chartConfig = {
          dataPoints,
          k: rule.k,
          m: rule.m,
          labels: {
            x: 'Static Compliance',
            y: 'Dynamic Compliance @ 10Hz',
            title: `10Hz vs Static Compliance for ${conditionsText} Pickups`,
            lineLabel: `Regression (y=${rule.k.toFixed(2)}x + ${rule.m.toFixed(2)})`
          }
        };

      } else {
        this.result = {
          compliance_min: null,
          compliance_median: null,
          compliance_max: null,
          confidence: 0,
          sampleSize: 0,
          description: 'Please provide a compliance value to get an estimate.',
          chartConfig: null,
        };
      }
    },
  },
});
