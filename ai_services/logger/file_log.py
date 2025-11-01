import logging
import os

def get_logger(name: str = "app", log_file: str = "logger/app.log") -> logging.Logger:
    # Ensure log directory exists
    os.makedirs(os.path.dirname(log_file) or ".", exist_ok=True)

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Prevent duplicate handlers if called multiple times
    if logger.hasHandlers():
        return logger

    # File handler
    file_handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
    file_handler.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Log format
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add handlers
    logger.addHandler(file_handler)

    return logger
