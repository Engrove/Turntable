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
    Huvudfunktion som läser in pickup-data, beräknar mediankvoter och R²-värden
    för olika segment, och skriver resultatet till en JSON-fil.
    """
    print("Startar generering av estimeringsregler för 100Hz -> 10Hz...")

    try:
        df_full = pd.read_json(PICKUP_DATA_PATH)
        print(f"Hämtade {len(df_full)} pickuper från '{PICKUP_DATA_PATH}'.")
    except Exception as e:
        print(f"Fel vid inläsning av JSON-data: {e}")
        return

    # Filtrera bort rader som saknar nödvändig data för denna analys
    df_analysis = df_full.dropna(subset=['cu_dynamic_100hz', 'cu_dynamic_10hz']).copy()
    print(f"Hittade {len(df_analysis)} pickuper med fullständiga 100Hz/10Hz-värden för analys.")

    if len(df_analysis) < MIN_SAMPLE_SIZE_FOR_RULE:
        print("Inte tillräckligt med data för att skapa meningsfulla regler. Avbryter.")
        return

    # Beräkna konverteringsration
    df_analysis['ratio'] = df_analysis['cu_dynamic_10hz'] / df_analysis['cu_dynamic_100hz']

    # Funktion för att utföra regression och få R²
    def get_r_squared(df_segment):
        if len(df_segment) < MIN_SAMPLE_SIZE_FOR_RULE:
            return 0.0 # Returnera ett lågt värde om det inte finns tillräckligt med data
        
        X = df_segment[['cu_dynamic_100hz']]
        y = df_segment['cu_dynamic_10hz']
        
        model = LinearRegression()
        model.fit(X, y)
        y_pred = model.predict(X)
        
        return r2_score(y, y_pred)

    # Skapa segmenterade regler
    segmented_rules = []
    rule_keys = [
        ['type', 'cantilever_class', 'stylus_family'], # Prio 1
        ['type', 'cantilever_class'],                 # Prio 2
        ['type']                                      # Prio 3
    ]

    # Använd en uppsättning för att undvika dubbletter av regler
    created_rules = set()

    for i, keys in enumerate(rule_keys):
        priority = i + 1
        grouped = df_analysis.groupby(keys)
        for name, group in grouped:
            # Skapa en unik nyckel för regeln för att undvika dubbletter
            # (t.ex. en Prio 2-regel kan vara identisk med en Prio 3-regel om det bara finns en cantilever_class för en viss typ)
            rule_key = tuple(sorted(group[keys].iloc[0].items()))
            if rule_key in created_rules:
                continue
            
            if len(group) >= MIN_SAMPLE_SIZE_FOR_RULE:
                r2 = get_r_squared(group)
                rule = {
                    'priority': priority,
                    'conditions': group[keys].iloc[0].to_dict(),
                    'median_ratio': round(group['ratio'].median(), 4),
                    'r_squared': round(r2, 4),
                    'sample_size': len(group)
                }
                segmented_rules.append(rule)
                created_rules.add(rule_key)

    print(f"Genererade {len(segmented_rules)} unika, segmenterade regler.")

    # Beräkna global fallback
    global_r2 = get_r_squared(df_analysis)
    global_fallback = {
        'priority': 99,
        'conditions': {},
        'median_ratio': round(df_analysis['ratio'].median(), 4),
        'r_squared': round(global_r2, 4),
        'sample_size': len(df_analysis)
    }

    # Sammanställ all information
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'source_data_count': len(df_full),
        'analysis_data_count': len(df_analysis),
        'global_fallback': global_fallback,
        'segmented_rules': sorted(segmented_rules, key=lambda x: (x['priority'], -x['sample_size']))
    }

    # Skriv till output-filen
    try:
        os.makedirs(os.path.dirname(OUTPUT_RULES_PATH), exist_ok=True)
        with open(OUTPUT_RULES_PATH, 'w') as f:
            json.dump(output_data, f, indent=2)
        print(f"Regler sparade framgångsrikt till '{OUTPUT_RULES_PATH}'.")
    except Exception as e:
        print(f"Fel vid skrivning till output-fil: {e}")


if __name__ == '__main__':
    generate_rules()
