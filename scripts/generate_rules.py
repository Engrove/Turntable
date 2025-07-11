# scripts/generate_rules.py

import json
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from datetime import datetime
import os

# --- Konfiguration ---
# Sökvägar relativa till projektets rotkatalog
PICKUP_DATA_PATH = os.path.join('data', 'pickup_data.json')
OUTPUT_RULES_PATH = os.path.join('public', 'estimation_rules.json')

def generate_rules():
    """
    Huvudfunktion som läser in pickup-data, tränar en modell,
    beräknar regler och skriver resultatet till en JSON-fil.
    """
    print("Startar generering av estimeringsregler...")

    # 1. Läs in och förbered data med pandas
    try:
        df_full = pd.read_json(PICKUP_DATA_PATH)
        print(f"Hämtade {len(df_full)} pickuper från '{PICKUP_DATA_PATH}'.")
    except Exception as e:
        print(f"Fel vid inläsning av JSON-data: {e}")
        return

    # Skapa en arbetskopia för analys, filtrera bort rader som saknar nödvändig data
    df_analysis = df_full.dropna(subset=['cu_dynamic_100hz', 'cu_dynamic_10hz']).copy()
    print(f"Hittade {len(df_analysis)} pickuper med fullständiga compliance-värden för analys.")

    if len(df_analysis) == 0:
        print("Ingen data tillgänglig för analys. Avbryter.")
        return

    # Beräkna konverteringsration
    df_analysis['ratio'] = df_analysis['cu_dynamic_10hz'] / df_analysis['cu_dynamic_100hz']

    # 2. Träna en Random Forest-modell för att hitta "Feature Importance"
    # Använd fler features för att ge en bättre modell, även för framtida bruk
    features = ['cu_dynamic_100hz', 'weight_g', 'type', 'cantilever_class', 'stylus_family']
    target = 'cu_dynamic_10hz'

    # Ta bort rader där någon av våra features saknas (speciellt viktigt för kategoriska)
    df_model = df_analysis.dropna(subset=features).copy()
    print(f"Använder {len(df_model)} kompletta rader för att träna modellen.")

    X = df_model[features]
    y = df_model[target]

    # Skapa en preprocessor för att hantera kategoriska och numeriska data
    categorical_features = ['type', 'cantilever_class', 'stylus_family']
    numeric_features = ['cu_dynamic_100hz', 'weight_g']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # Skapa en pipeline med preprocessor och modellen
    model = Pipeline(steps=[('preprocessor', preprocessor),
                            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))])

    # Träna modellen
    model.fit(X, y)
    print("Modell tränad framgångsrikt.")

    # Extrahera feature importance
    try:
        regressor = model.named_steps['regressor']
        ohe_feature_names = model.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(categorical_features)
        all_feature_names = numeric_features + list(ohe_feature_names)
        importances = regressor.feature_importances_
        feature_importance_dict = dict(zip(all_feature_names, importances))
    except Exception as e:
        print(f"Kunde inte extrahera feature importance: {e}")
        feature_importance_dict = {}

    # 3. Beräkna segmenterade median-konverteringsfaktorer
    # Vi fokuserar på de mest relevanta kategorierna: 'type' och 'cantilever_class'
    df_rules = df_analysis.dropna(subset=['type', 'cantilever_class']).copy()
    grouped = df_rules.groupby(['type', 'cantilever_class'])

    segmented_rules = []
    for (pickup_type, cantilever), group in grouped:
        if len(group) > 0: # Inkludera endast grupper med minst 1 medlem
            rule = {
                'conditions': {
                    'type': pickup_type,
                    'cantilever_class': cantilever
                },
                'median_ratio': round(group['ratio'].median(), 4),
                'sample_size': len(group)
            }
            segmented_rules.append(rule)
    print(f"Genererade {len(segmented_rules)} segmenterade regler.")

    # 4. Beräkna global fallback-median
    global_fallback = {
        'median_ratio': round(df_analysis['ratio'].median(), 4),
        'sample_size': len(df_analysis)
    }

    # 5. Sammanställ all information till en JSON-struktur
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'source_data_count': len(df_full),
        'analysis_data_count': len(df_analysis),
        'feature_importance': feature_importance_dict,
        'global_fallback': global_fallback,
        'segmented_rules': sorted(segmented_rules, key=lambda x: x['sample_size'], reverse=True) # Sortera efter relevans
    }

    # 6. Skriv till output-filen
    try:
        os.makedirs(os.path.dirname(OUTPUT_RULES_PATH), exist_ok=True)
        with open(OUTPUT_RULES_PATH, 'w') as f:
            json.dump(output_data, f, indent=2)
        print(f"Regler sparade framgångsrikt till '{OUTPUT_RULES_PATH}'.")
    except Exception as e:
        print(f"Fel vid skrivning till output-fil: {e}")


if __name__ == '__main__':
    # Detta gör att skriptet kan köras från terminalen med "python scripts/generate_rules.py"
    generate_rules()
