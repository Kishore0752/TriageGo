import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

# Create logs directory if it doesn't exist
LOGS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

class Logger:
    """Centralized logging for the application"""
    
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        
        if not self.logger.handlers:
            # Set log level
            log_level = os.getenv('LOG_LEVEL', 'INFO')
            self.logger.setLevel(getattr(logging, log_level))
            
            # Console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(getattr(logging, log_level))
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)
            
            # File handler with rotation
            log_file = os.path.join(LOGS_DIR, f"medcompare_{datetime.now().strftime('%Y%m%d')}.log")
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
            file_handler.setLevel(getattr(logging, log_level))
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
            )
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def info(self, message):
        self.logger.info(message)
    
    def error(self, message, exc_info=False):
        self.logger.error(message, exc_info=exc_info)
    
    def warning(self, message):
        self.logger.warning(message)
    
    def debug(self, message):
        self.logger.debug(message)

# Create logger instances for different modules
def get_logger(name):
    return Logger(name).logger
