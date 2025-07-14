# scripts/generate_static_rules.py

import json
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from datetime import datetime
import os

# --- Konfiguration ---
PICKUP_DATA_PATH = os.path.join('public', 'data', 'pickup_data.json')
OUTPUT_RULES_PATH = os.path.join('public', 'data', 'static_estimation_rules.json')
MIN_SAMPLE_SIZE_FOR_RULE = 3 # Kräv minst 3 datapunkter för att skapa en specifik regel

def generate_static_rules():
    """
    Läser in pickup-data, utför regressionsanalys på Static -> 10Hz compliance,
    och genererar en JSON-fil med regler för estimering.
    """
    print("Startar generering av regler för statisk compliance-estimering...")

    try:
        df_full = pd.read_json(PICKUP_DATA_PATH)
        print(f"Hämtade {len(df_full)} pickuper från '{PICKUP_DATA_PATH}'.")
    except Exception as e:
        print(f"Fel vid inläsning av JSON-data: {e}")
        return

    # 1. KORREKT OCH STRIKT FILTRERING
    # Vi kan BARA använda data där vi har ett verifierat 10Hz-värde.
    df_verified = df_full[df_full['is_estimated_10hz'] == False].copy()
    
    # Från den verifierade datan, ta de som har BÅDE static och 10Hz dynamic.
    df_analysis = df_verified.dropna(subset=['cu_static', 'cu_dynamic_10hz']).copy()
    
    total_analysis_points = len(df_analysis)
    print(f"Hittade {total_analysis_points} pickuper med verifierade statiska och 10Hz-värden för analys.")

    if total_analysis_points < MIN_SAMPLE_SIZE_FOR_RULE:
        print("Inte tillräckligt med data för att skapa meningsfulla regler. Avbryter.")
        return

    # Funktion för att utföra regression och returnera resultat
    def get_regression_results(df_segment):
        if len(df_segment) < MIN_SAMPLE_SIZE_FOR_RULE:
            return None
        
        X = df_segment[['cu_static']]
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

    # 2. Skapa regler för olika segment
    segmented_rules = []
    
    # Prioritet 1: Type + Cantilever + Stylus
    grouped_p1 = df_analysis.groupby(['type', 'cantilever_class', 'stylus_family'])
    for (pickup_type, cantilever, stylus), group in grouped_p1:
        res = get_regression_results(group)
        if res:
            segmented_rules.append({
                'priority': 1,
                'conditions': {'type': pickup_type, 'cantilever_class': cantilever, 'stylus_family': stylus},
                **res
            })

    # Prioritet 2: Type + Cantilever
    grouped_p2 = df_analysis.groupby(['type', 'cantilever_class'])
    for (pickup_type, cantilever), group in grouped_p2:
        res = get_regression_results(group)
        if res:
            segmented_rules.append({
                'priority': 2,
                'conditions': {'type': pickup_type, 'cantilever_class': cantilever},
                **res
            })

    # Prioritet 3: Type
    grouped_p3 = df_analysis.groupby('type')
    for pickup_type, group in grouped_p3:
        res = get_regression_results(group)
        if res:
            segmented_rules.append({
                'priority': 3,
                'conditions': {'type': pickup_type},
                **res
            })
            
    print(f"Genererade {len(segmented_rules)} segmenterade regler.")

    # 3. Beräkna global fallback-regel
    global_fallback_res = get_regression_results(df_analysis)
    global_fallback = {
        'priority': 99,
        'conditions': {},
        **global_fallback_res
    }

    # 4. Sammanställ och spara JSON-fil
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'source_data_count': total_analysis_points,
        'global_fallback': global_fallback,
        'segmented_rules': segmented_rules
    }

    try:
        os.makedirs(os.path.dirname(OUTPUT_RULES_PATH), exist_ok=True)
        with open(OUTPUT_RULES_PATH, 'w') as f:
            # Formatera flyttal till 3 decimaler för läsbarhet
            json_str = json.dumps(output_data, indent=2)
            import re
            json_str = re.sub(r'(\d+\.\d{3})\d+', r'\1', json_str)
            f.write(json_str)
        print(f"Regler för statisk compliance sparade till '{OUTPUT_RULES_PATH}'.")
    except Exception as e:
        print(f"Fel vid skrivning till output-fil: {e}")

if __name__ == '__main__':
    generate_static_rules()
