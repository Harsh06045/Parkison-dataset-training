import os
import sys
import logging

def setup_logger(name, log_file=None, level=logging.INFO):
    """
    Function to setup a logger; writes to both console and a file.
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if logger is already initialized
    if logger.handlers:
        return logger
        
    logger.setLevel(level)
    
    # Create console handler and set level
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    
    # Add formatter to handlers
    ch.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(ch)
    
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        fh = logging.FileHandler(log_file, encoding='utf-8')
        fh.setLevel(level)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
        
    return logger
