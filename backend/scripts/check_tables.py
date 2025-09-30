import django, sys
sys.path.append('.')
from django.conf import settings
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
django.setup()
from django.db import connection
tables = connection.introspection.table_names()
for t in sorted(tables):
    if t.startswith('forum_'):
        print(t)

print('\ncheck for forum_comment_likes:', 'forum_comment_likes' in tables)
