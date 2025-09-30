from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from pathlib import Path
import shutil

User = get_user_model()

class Command(BaseCommand):
    help = "Backfill missing user avatars: copy default image into MEDIA_ROOT and set user.avatar to default path when empty"

    def handle(self, *args, **options):
        media_root = Path(settings.MEDIA_ROOT)
        avatars_dir = media_root / 'avatars'
        avatars_dir.mkdir(parents=True, exist_ok=True)

        # Source default image in frontend public folder
        # settings.BASE_DIR points to the backend folder; the frontend folder lives alongside it
        repo_root = Path(settings.BASE_DIR).parent
        frontend_default = repo_root / 'frontend' / 'public' / 'default-avatar.png'
        target_default = avatars_dir / 'default-avatar.png'

        if frontend_default.exists():
            if not target_default.exists():
                shutil.copyfile(str(frontend_default), str(target_default))
                self.stdout.write(self.style.SUCCESS(f'Copied default avatar to {target_default}'))
            else:
                self.stdout.write(f'Default avatar already present at {target_default}')
        else:
            self.stdout.write(self.style.WARNING(f'Frontend default avatar not found at {frontend_default}. Please ensure a default avatar exists.'))

        users = User.objects.all()
        updated = 0
        for u in users:
            # Treat blank/None/empty string as missing
            if not getattr(u, 'avatar'):
                # Set to default relative path saved in ImageField
                u.avatar = 'avatars/default-avatar.png'
                u.save(update_fields=['avatar'])
                updated += 1
        self.stdout.write(self.style.SUCCESS(f'Updated {updated} users to default avatar'))
