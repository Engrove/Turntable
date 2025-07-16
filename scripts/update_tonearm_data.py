# scripts/update_tonearm_data.py
import json
import os

# Define file paths
TONEARM_DATA_PATH = os.path.join('public', 'data', 'tonearm_data.json')
TONEARM_DIFF_PATH = os.path.join('public', 'data', 'tonearm_diff.json')

# --- Schema Definition ---
# This dictionary defines the complete structure for every tonearm object.
# All new fields must be added here with a default value (usually None).
DEFAULT_TONEARM_SCHEMA = {
    "id": None,
    "manufacturer": None,
    "model": None,
    "effective_length_mm": None,
    "pivot_to_spindle_mm": None,
    "overhang_mm": None,
    "effective_mass_g": None,
    "bearing_type": None,          # NEW
    "arm_material": None,        # NEW
    "arm_shape": None,           # NEW
    "headshell_connector": None, # NEW
    "tracking_method": "pivoting", # NEW (with a default value)
    "notes": None,
    "example_params_for_calculator": None
}

def update_tonearm_data():
    """
    Loads tonearm data and a diff file, then merges the diff into the main
    data, ensuring all records conform to the schema. The updated data
    is written back to the tonearm_data.json file.
    """
    print("Starting tonearm data update process...")

    # Load original tonearm data
    try:
        with open(TONEARM_DATA_PATH, 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        print(f"Successfully loaded {len(original_data)} records from '{TONEARM_DATA_PATH}'.")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading original tonearm data: {e}. Aborting.")
        return

    # Load diff data
    try:
        with open(TONEARM_DIFF_PATH, 'r', encoding='utf-8') as f:
            diff_data = json.load(f)
        print(f"Successfully loaded {len(diff_data)} diff records from '{TONEARM_DIFF_PATH}'.")
    except FileNotFoundError:
        print(f"No diff file found at '{TONEARM_DIFF_PATH}'. No changes will be applied.")
        diff_data = []
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from diff file: {e}. Aborting.")
        return

    # Create a dictionary for quick lookup of diffs by ID
    diff_map = {item['id']: item for item in diff_data if 'id' in item}

    updated_data = []
    processed_ids = set()

    # Process original data, applying diffs and ensuring schema conformance
    for item in original_data:
        if 'id' not in item or item['id'] is None:
            print(f"Skipping record with missing ID: {item}")
            continue
        
        item_id = item['id']
        if item_id in processed_ids:
            print(f"Warning: Duplicate ID {item_id} found in original data. Skipping.")
            continue
            
        processed_ids.add(item_id)

        # Create a new, clean record based on the schema
        new_item = DEFAULT_TONEARM_SCHEMA.copy()
        
        # Populate with existing data from the original file
        for key in new_item:
            if key in item:
                new_item[key] = item[key]
        
        # Update with data from the diff file if a match is found
        if item_id in diff_map:
            diff_item = diff_map[item_id]
            for key, value in diff_item.items():
                if key in new_item:
                    new_item[key] = value
                else:
                    print(f"Warning: Unknown key '{key}' for ID {item_id} in diff file. Ignoring.")

        updated_data.append(new_item)

    # Write the updated data back to the file
    try:
        with open(TONEARM_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2)
        print(f"Successfully updated and wrote {len(updated_data)} records to '{TONEARM_DATA_PATH}'.")
    except Exception as e:
        print(f"Error writing updated data to file: {e}")

if __name__ == '__main__':
    update_tonearm_data()