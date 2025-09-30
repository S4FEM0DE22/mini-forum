from django.contrib import admin
from django.utils.html import format_html
from django.shortcuts import redirect
from .models import Post, Category, Comment, Report, User, Tag

# ------------------------
# User & Basic Models
# ------------------------
admin.site.register(User)
admin.site.register(Category)
admin.site.register(Post)
admin.site.register(Tag)

# --- Comment Admin ---
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "body", "post", "created_at")
    search_fields = ("user__username", "body", "post__title")
    list_filter = ("created_at",)

# ------------------------
# Inline Forms for Post & Comment
# ------------------------
class PostInline(admin.StackedInline):
    model = Post
    fields = ('title', 'body', 'category')
    extra = 0
    readonly_fields = ('title',)
    can_delete = False

class CommentInline(admin.StackedInline):
    model = Comment
    fields = ('body',)
    extra = 0
    can_delete = False

# ------------------------
# Report Admin
# ------------------------
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'report_target', 'action', 'resolved', 'created_at', 'do_action')
    list_filter = ('resolved', 'action')
    readonly_fields = ('report_target', 'reason', 'user', 'created_at')

    # แสดง target ของ report
    def report_target(self, obj):
        if obj.post:
            return format_html(f"โพสต์: {obj.post.title}")
        elif obj.comment:
            return format_html(f"คอมเมนต์: {obj.comment.body[:50]}...")
        return "-"
    report_target.short_description = "Target"

    # ปุ่มดำเนินการตาม action
    def do_action(self, obj):
        if obj.resolved:
            return "✅ ดำเนินการแล้ว"
        if obj.action == "delete":
            return format_html(
                f"<a class='button' href='/admin/forum/report/{obj.id}/delete_target/'>ลบ</a>"
            )
        elif obj.action == "edit":
            return format_html(
                f"<a class='button' href='/admin/forum/report/{obj.id}/edit_inline/'>แก้ไข</a>"
            )
        return "-"
    do_action.short_description = "ดำเนินการ"

    # Inline forms สำหรับแก้ไข target
    def get_inline_instances(self, request, obj=None):
        inlines = []
        if obj:
            if obj.post:
                inlines.append(PostInline(self.model, self.admin_site))
            elif obj.comment:
                inlines.append(CommentInline(self.model, self.admin_site))
        return inlines

    # Custom URLs สำหรับ delete/edit
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:report_id>/delete_target/', self.admin_site.admin_view(self.delete_target)),
            path('<int:report_id>/edit_inline/', self.admin_site.admin_view(self.edit_inline)),
        ]
        return custom_urls + urls

    # ลบ target
    def delete_target(self, request, report_id):
        report = Report.objects.get(id=report_id)
        if report.post:
            report.post.delete()
        elif report.comment:
            report.comment.delete()
        report.resolved = True
        report.save()
        self.message_user(request, "ดำเนินการลบเรียบร้อยแล้ว")
        return redirect(request.META.get('HTTP_REFERER'))

    # แก้ไข inline
    def edit_inline(self, request, report_id):
        report = Report.objects.get(id=report_id)
        return redirect(f'/admin/forum/report/{report.id}/change/')

    # กำหนด inline forms แค่หน้า change
    def change_view(self, request, object_id, form_url='', extra_context=None):
        report = Report.objects.get(pk=object_id)
        if report.resolved:
            self.inlines = []
        else:
            self.inlines = self.get_inline_instances(request, report)
        return super().change_view(request, object_id, form_url, extra_context)
