"""
Response utilities for consistent API responses
"""
from typing import Any, Dict, List, Optional
from datetime import datetime

class APIResponse:
    """Consistent API response formatter"""
    
    @staticmethod
    def success(data: Any, message: str = "Success", metadata: Dict = None) -> Dict:
        """Format successful response"""
        response = {
            "status": "success",
            "message": message,
            "data": data,
            "timestamp": datetime.now().isoformat(),
        }
        
        if metadata:
            response["metadata"] = metadata
        
        return response
    
    @staticmethod
    def error(message: str, error_code: str = "ERROR", details: Any = None) -> Dict:
        """Format error response"""
        response = {
            "status": "error",
            "message": message,
            "error_code": error_code,
            "timestamp": datetime.now().isoformat(),
        }
        
        if details:
            response["details"] = details
        
        return response
    
    @staticmethod
    def paginated(
        items: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 20,
        message: str = "Success"
    ) -> Dict:
        """Format paginated response"""
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "status": "success",
            "message": message,
            "data": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
            "timestamp": datetime.now().isoformat(),
        }

def create_success_response(data, message="Success", **kwargs):
    """Shortcut for success response"""
    return APIResponse.success(data, message, kwargs)

def create_error_response(message, error_code="ERROR", details=None):
    """Shortcut for error response"""
    return APIResponse.error(message, error_code, details)

def create_paginated_response(items, total, page=1, page_size=20, message="Success"):
    """Shortcut for paginated response"""
    return APIResponse.paginated(items, total, page, page_size, message)
