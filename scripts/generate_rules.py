# scripts/generate_rules.py

import json
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from datetime import datetime
import os

# --- Konfiguration ---
PICKUP_DATA_PATH = os.path.join('public', 'data', 'pickup_data.json')
OUTPUT_RULES_PATH = os.path.join('public', 'data', 'estimation_rules.json')
MIN_SAMPLE_SIZE_FOR_RULE = 3 # Kräv minst 3 datapunkter för att skapa en specifik regel

def generate_rules():
    """
    Huvudfunktion som läser in pickup-data, utför regressionsanalys på 100Hz -> 10Hz,
    och skriver resultatet till en JSON-fil.
    """
    print("Startar generering av regressionsregler för 100Hz -> 10Hz...")

    try:
        df_full = pd.read_json(PICKUP_DATA_PATH)
        print(f"Hämtade {len(df_full)} pickuper från '{PICKUP_DATA_PATH}'.")
    except Exception as e:
        print(f"Fel vid inläsning av JSON-data: {e}")
        return

    # Filtrera bort rader som saknar nödvändig data för denna analys
    df_analysis = df_full.dropna(subset=['cu_dynamic_100hz', 'cu_dynamic_10hz']).copy()
    analysis_count = len(df_analysis)
    print(f"Hittade {analysis_count} pickuper med fullständiga 100Hz/10Hz-värden för analys.")

    if analysis_count < MIN_SAMPLE_SIZE_FOR_RULE:
        print("Inte tillräckligt med data för att skapa meningsfulla regler. Avbryter.")
        return

    # Funktion för att utföra regression och returnera resultat
    def get_regression_results(df_segment):
        if len(df_segment) < MIN_SAMPLE_SIZE_FOR_RULE:
            return None
        
        X = df_segment[['cu_dynamic_100hz']]
        y = df_segment['cu_dynamic_10hz']
        
        model = LinearRegression()
        model.fit(X, y)
        
        y_pred = model.predict(X)
        r2 = r2_score(y, y_pred)
        
        return {
            'k': model.coef_[0],
            'm': model.intercept_,
            'r_squared': r2,
            'sample_size': len(df_segment)
        }

    # Skapa segmenterade regler
    segmented_rules = []
    rule_keys = [
        ['type', 'cantilever_class', 'stylus_family'], # Prio 1
        ['type', 'cantilever_class'],                 # Prio 2
        ['type']                                      # Prio 3
    ]
    created_rules = set()

    for i, keys in enumerate(rule_keys):
        priority = i + 1
        grouped = df_analysis.groupby(keys)
        for name, group in grouped:
            # Skapa en unik nyckel för regeln baserat på villkoren
            condition_tuple = tuple(sorted(group[keys].iloc[0].to_dict().items()))
            if condition_tuple in created_rules:
                continue

            res = get_regression_results(group)
            if res:
                rule = {
                    'priority': priority,
                    'conditions': group[keys].iloc[0].to_dict(),
                    **res
                }
                segmented_rules.append(rule)
                created_rules.add(condition_tuple)

    print(f"Genererade {len(segmented_rules)} unika, segmenterade regler.")

    # Beräkna global fallback
    global_fallback_res = get_regression_results(df_analysis)
    global_fallback = {
        'priority': 99,
        'conditions': {},
        **global_fallback_res
    }

    # Sammanställ all information
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'source_data_count': len(df_full),
        'analysis_data_count': analysis_count,
        'global_fallback': global_fallback,
        'segmented_rules': sorted(segmented_rules, key=lambda x: (x['priority'], -x['sample_size']))
    }

    # Skriv till output-filen
    try:
        os.makedirs(os.path.dirname(OUTPUT_RULES_PATH), exist_ok=True)
        # Formatera flyttal för läsbarhet
        json_str = json.dumps(output_data, indent=2)
        import re
        json_str = re.sub(r'(\d+\.\d{4})\d+', r'\1', json_str)
        with open(OUTPUT_RULES_PATH, 'w') as f:
            f.write(json_str)
        print(f"Regressionsregler sparade framgångsrikt till '{OUTPUT_RULES_PATH}'.")
    except Exception as e:
        print(f"Fel vid skrivning till output-fil: {e}")

if __name__ == '__main__':
    generate_rules()
