# -*- coding: utf-8 -*-
import redis
import json
from typing import Optional, Any

class RedisCache:
    def __init__(self, host='localhost', port=6379, db=0):
        try:
            self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
            self.client.ping()
            self.enabled = True
            print("✅ Redis connecte")
        except:
            self.enabled = False
            print("⚠️ Redis non disponible - mode sans cache")
    
    def get(self, key: str) -> Optional[Any]:
        if not self.enabled:
            return None
        try:
            data = self.client.get(key)
            return json.loads(data) if data else None
        except:
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        if not self.enabled:
            return
        try:
            self.client.setex(key, ttl, json.dumps(value, default=str))
        except:
            pass
    
    def delete(self, key: str):
        if not self.enabled:
            return
        try:
            self.client.delete(key)
        except:
            pass
    
    def clear_pattern(self, pattern: str):
        if not self.enabled:
            return
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
        except:
            pass
    
    def incr(self, key: str) -> int:
        if not self.enabled:
            return 0
        try:
            return self.client.incr(key)
        except:
            return 0
    
    def expire(self, key: str, ttl: int):
        if not self.enabled:
            return
        try:
            self.client.expire(key, ttl)
        except:
            pass

cache = RedisCache()
