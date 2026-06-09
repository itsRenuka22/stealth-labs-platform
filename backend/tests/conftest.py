# backend/tests/conftest.py
"""
Pytest configuration for backend tests.
Sets up the Python path so test files can import from the backend package.
Part of SLS-36: CI/CD pipeline setup.
"""
import os
import sys

# Add the backend directory to sys.path so that
# 'from services.health import ...' works in test files
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
