import time
import hashlib
from ..config.settings import CACHE_TTL

_cache = {}

def _cache_key(*parts):
    """Generate cache key from parts"""
    return hashlib.md5("_".join(str(p) for p in parts).encode()).hexdigest()

def _get_cache(key):
    """Retrieve from cache if not expired"""
    e = _cache.get(key)
    return e["data"] if e and (time.time() - e["ts"]) < CACHE_TTL else None

def _set_cache(key, data):
    """Store in cache with timestamp"""
    _cache[key] = {"ts": time.time(), "data": data}

def clear_cache():
    """Clear entire cache"""
    global _cache
    _cache = {}
