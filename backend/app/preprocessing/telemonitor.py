import pandas as pd
import numpy as np

def preprocess_telemonitor_file(file_path):
    """
    Parse a telemonitoring CSV file and extract a 19-dimensional feature vector.
    """
    if not file_path.lower().endswith('.csv'):
        raise ValueError("Unsupported telemonitoring file format. Must be a .csv file.")
        
    try:
        df = pd.read_csv(file_path)
        if df.empty:
            raise ValueError("Telemonitoring CSV file is empty.")
            
        # Drop target UPDRS columns if they are in the CSV
        for col in ['motor_UPDRS', 'total_UPDRS']:
            if col in df.columns:
                df = df.drop(columns=[col])
                
        features = df.iloc[0].values.astype(np.float32)
        if len(features) != 19:
            raise ValueError(f"Telemonitoring features count is {len(features)}, but expected exactly 19.")
            
        return features
    except Exception as e:
        raise ValueError(f"Failed to parse Telemonitoring CSV: {e}")
