# scripts/update_tonearm_data.py
import json
import os
import sys

# Define file paths relative to the project root
TONEARM_DATA_PATH = os.path.join('public', 'data', 'tonearm_data.json')
TONEARM_DIFF_PATH = os.path.join('public', 'data', 'tonearm_diff.json')

# --- New, Comprehensive Schema Definition (Version 2.0) ---
# This dictionary defines the complete, authoritative structure for every tonearm object,
# based on the technical report. All records will be conformed to this schema.
DEFAULT_TONEARM_SCHEMA = {
    "id": None,
    "rectype": "A",
    "manufacturer": None,
    "model": None,
    "effective_length_mm": None,
    "pivot_to_spindle_mm": None,
    "overhang_mm": None,
    "offset_angle_deg": None,
    "effective_mass_g": None,
    "arm_shape": None,
    "arm_material": None,
    "bearing_type": None,
    "headshell_connector": None,
    "cartridge_weight_range_g": None,
    "stylus_pressure_range_g": None,
    "vta_adjustment": None,
    "azimuth_adjustment": None,
    "internal_wiring_material": None,
    "detachable_cable": None,
    "external_cable_capacitance_pf": None,
    "alignment_geometry": None,
    "null_points_mm": None,
    "tracking_method": "pivoting",
    "notes": None,
    "example_params_for_calculator": None
}

def load_json_file(filepath):
    """
    Loads a JSON file with robust error handling.
    """
    if not os.path.exists(filepath):
        print(f"Error: File not found at '{filepath}'", file=sys.stderr)
        return None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to decode JSON from '{filepath}'. Details: {e}", file=sys.stderr)
        return None
    except IOError as e:
        print(f"Error: Could not read file at '{filepath}'. Details: {e}", file=sys.stderr)
        return None

def save_json_file(data, filepath):
    """
    Saves data to a JSON file with pretty printing (indent=2).
    """
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Successfully saved updated data to '{filepath}'")
        return True
    except IOError as e:
        print(f"Error: Could not write to file at '{filepath}'. Details: {e}", file=sys.stderr)
        return False

def update_tonearm_data():
    """
    Main processing function. Loads main data, applies diffs, enforces the
    new schema across all records, and saves the result.
    """
    print("Starting tonearm data update process with schema v2.0...")

    main_data = load_json_file(TONEARM_DATA_PATH)
    if main_data is None:
        sys.exit(1)
    print(f"Loaded {len(main_data)} records from '{TONEARM_DATA_PATH}'.")

    diff_data = load_json_file(TONEARM_DIFF_PATH)
    if diff_data is None:
        # If diff file is missing, we still proceed to enforce the new schema.
        print(f"Warning: Diff file not found at '{TONEARM_DIFF_PATH}'. Proceeding with schema enforcement only.")
        diff_data = []
    else:
        print(f"Loaded {len(diff_data)} transaction(s) from '{TONEARM_DIFF_PATH}'.")

    # --- Core Logic: Apply Diffs and Add New Records ---
    data_map = {record['id']: record for record in main_data}
    added_count, updated_count, deactivated_count = 0, 0, 0
    updated_ids = set()

    for transaction in diff_data:
        record_id = transaction.get('id')
        if not record_id:
            print(f"Warning: Skipping transaction with no 'id': {transaction}", file=sys.stderr)
            continue
        
        transaction_data = transaction.get('data', {})

        if record_id in data_map:
            # Update existing record
            data_map[record_id].update(transaction_data)
            if record_id not in updated_ids:
                updated_count += 1
                updated_ids.add(record_id)
            if transaction_data.get('rectype') == 'I':
                deactivated_count += 1
        else:
            # Add new record
            new_record = DEFAULT_TONEARM_SCHEMA.copy()
            new_record.update(transaction_data) # Apply data from diff
            new_record['id'] = record_id       # Set ID
            if 'rectype' not in transaction_data:
                new_record['rectype'] = 'A'    # Default to Active
            
            main_data.append(new_record)
            data_map[record_id] = new_record   # Add to map for subsequent diffs
            added_count += 1

    print("\nDiff processing summary:")
    print(f"  - Records added: {added_count}")
    print(f"  - Records updated: {updated_count} (including {deactivated_count} deactivated)")
    
    # --- Final Step: Schema Enforcement ---
    # Ensure every record in the final list conforms to the new default schema.
    # This adds any new keys with their default values to all existing records.
    final_data = []
    for record in main_data:
        conformed_record = DEFAULT_TONEARM_SCHEMA.copy()
        conformed_record.update(record)
        final_data.append(conformed_record)
    
    # Sort data by ID to maintain a consistent order
    final_data.sort(key=lambda x: x.get('id', 0))

    if not save_json_file(final_data, TONEARM_DATA_PATH):
        sys.exit(1)

    print(f"\nProcess complete. '{TONEARM_DATA_PATH}' has been updated with {len(final_data)} records conformed to the new schema.")

if __name__ == '__main__':
    update_tonearm_data()