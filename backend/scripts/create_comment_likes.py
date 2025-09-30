import django, sys, textwrap
sys.path.append('.')
from django.conf import settings
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
django.setup()
from django.db import connection
sql = textwrap.dedent('''
CREATE TABLE IF NOT EXISTS forum_comment_likes (
    id serial PRIMARY KEY,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE IF EXISTS forum_comment_likes
    ADD CONSTRAINT forum_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES forum_comment (id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE IF EXISTS forum_comment_likes
    ADD CONSTRAINT forum_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES forum_user (id) DEFERRABLE INITIALLY DEFERRED;
''')
cur = connection.cursor()
cur.execute(sql)
connection.commit()
print('Created forum_comment_likes (if not present)')
