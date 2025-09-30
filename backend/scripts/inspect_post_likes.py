import django, sys
sys.path.append('.')
from django.conf import settings
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
django.setup()
from django.db import connection
cur = connection.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='forum_post_likes'")
rows = cur.fetchall()
print('columns in forum_post_likes:')
for r in rows:
    print(r)
