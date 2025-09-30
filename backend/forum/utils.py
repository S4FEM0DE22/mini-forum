from django.core.cache import cache
import time

# 🔹 Rate Limit
def is_rate_limited(user_id: int, action: str, limit: int = 5, window: int = 60):
    """
    limit = จำนวนครั้งสูงสุด
    window = วินาที
    """
    key = f"rate_limit:{user_id}:{action}"
    count = cache.get(key, 0)

    if count >= limit:
        return True  # เกิน limit

    cache.incr(key)
    cache.expire(key, window)
    return False


# 🔹 Hot Posts
def add_hot_post(post_id: int, score: int = 1):
    """
    ใช้ ZSET ใน Redis
    """
    key = "hot_posts"
    cache.get_client().zadd(key, {post_id: score})


def get_hot_posts(limit: int = 10):
    """
    คืนค่า post_id ที่ hot ที่สุด
    """
    key = "hot_posts"
    return cache.get_client().zrevrange(key, 0, limit - 1, withscores=True)
