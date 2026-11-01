"""
Telemonitoring tabular preprocessing and quality validation.
Extracts 19 clinical and telemonitoring speech/motor features:
  ['age', 'sex', 'test_time', 'Jitter(%)', 'Jitter(Abs)', 'Jitter:RAP',
   'Jitter:PPQ5', 'Jitter:DDP', 'Shimmer', 'Shimmer(dB)', 'Shimmer:APQ3',
   'Shimmer:APQ5', 'Shimmer:APQ11', 'Shimmer:DDA', 'NHR', 'HNR', 'RPDE', 'DFA', 'PPE']
"""

import os
import pandas as pd
import numpy as np


TELEMONITOR_FEATURES = [
    'age', 'sex', 'test_time', 'Jitter(%)', 'Jitter(Abs)', 'Jitter:RAP',
    'Jitter:PPQ5', 'Jitter:DDP', 'Shimmer', 'Shimmer(dB)', 'Shimmer:APQ3',
    'Shimmer:APQ5', 'Shimmer:APQ11', 'Shimmer:DDA', 'NHR', 'HNR', 'RPDE', 'DFA', 'PPE'
]


def validate_telemonitor_quality(file_path):
    """
    Validates telemonitoring CSV file structure, non-emptiness, and missing values.
    Returns:
        dict: {'valid': bool, 'num_records': int, 'has_targets': bool, 'reason': str}
    """
    if not os.path.exists(file_path):
        return {'valid': False, 'num_records': 0, 'has_targets': False, 'reason': "File does not exist."}

    if not file_path.lower().endswith('.csv'):
        return {'valid': False, 'num_records': 0, 'has_targets': False, 'reason': "Invalid format. Expected .csv file."}

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return {'valid': False, 'num_records': 0, 'has_targets': False, 'reason': f"Failed to read CSV: {e}"}

    if df.empty:
        return {'valid': False, 'num_records': 0, 'has_targets': False, 'reason': "Telemonitoring CSV is empty."}

    has_targets = 'motor_UPDRS' in df.columns or 'total_UPDRS' in df.columns

    # Check for NaN / null values
    if df.isnull().values.any():
        null_count = int(df.isnull().sum().sum())
        return {'valid': False, 'num_records': len(df), 'has_targets': has_targets,
                'reason': f"CSV contains {null_count} missing (NaN) values. Data must be complete."}

    return {'valid': True, 'num_records': len(df), 'has_targets': has_targets, 'reason': "OK"}


def preprocess_telemonitor_file(file_path):
    """
    Parse a telemonitoring CSV file and extract a 19-dimensional feature vector.
    """
    quality = validate_telemonitor_quality(file_path)
    if not quality['valid']:
        raise ValueError(f"Telemonitoring Validation Failed: {quality['reason']}")

    try:
        df = pd.read_csv(file_path)

        # Drop target UPDRS columns and patient identifiers if present
        for col in ['motor_UPDRS', 'total_UPDRS', 'subject#', 'subject_id', 'id']:
            if col in df.columns:
                df = df.drop(columns=[col])

        # If columns match expected feature names, align them
        if set(TELEMONITOR_FEATURES).issubset(set(df.columns)):
            df = df[TELEMONITOR_FEATURES]

        features = df.iloc[0].values.astype(np.float32)
        if len(features) != 19:
            raise ValueError(f"Telemonitoring features count is {len(features)}, but expected exactly 19.")

        return features
    except Exception as e:
        raise ValueError(f"Failed to parse Telemonitoring CSV: {e}")
