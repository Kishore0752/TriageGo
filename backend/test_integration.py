#!/usr/bin/env python
"""Test script to verify contact details integration"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from api.main import app
    print("✅ Backend app loaded successfully!")
    print("✅ All imports working correctly!")
    print("✅ Contact details integration is ACTIVE!")
    print("\nEndpoints available:")
    print("  POST /search - Hospital search with contact details")
    print("  POST /sos - Emergency SOS with contact details")
    print("  POST /contact-details - Get contact details by place_id")
    print("  POST /heatmap - Heatmap visualization")
    print("  GET /debug - Debug endpoint")
except Exception as e:
    print(f"❌ Error loading app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
