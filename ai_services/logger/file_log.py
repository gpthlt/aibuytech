import logging
import os

def get_logger(name: str = "app", log_file: str = "logger/app.log") -> logging.Logger:
    # Ensure log directory exists
    os.makedirs(os.path.dirname(log_file) or ".", exist_ok=True)

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    
    if logger.hasHandlers():
        logger.handlers.clear()

    # File handler
    file_handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
    file_handler.setLevel(logging.INFO)

    # Log format — include file, line, and function
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: (%(filename)s:%(lineno)d in %(funcName)s) → %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    return logger
