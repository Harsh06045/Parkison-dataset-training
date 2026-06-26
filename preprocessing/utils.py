import os
import logging

def setup_logger(name, log_file=None, level=logging.INFO):
    """
    Sets up a logger with console and optional file logging.
    """
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    logger = logging.getLogger(name)
    if logger.hasHandlers():
        return logger
        
    # Stream Handler
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    logger.setLevel(level)
    
    # File Handler
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
    return logger

def check_missing_values(df, dataset_name="Dataset"):
    """
    Helper to check and report missing values in a pandas DataFrame.
    """
    missing = df.isnull().sum()
    total_missing = missing.sum()
    if total_missing > 0:
        print(f"[{dataset_name}] Found {total_missing} missing values:")
        print(missing[missing > 0])
    else:
        print(f"[{dataset_name}] No missing values found.")
    return total_missing
