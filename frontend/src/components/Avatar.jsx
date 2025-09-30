export default function Avatar({ src, size = 40 }) {
  const defaultAvatar = "/default-avatar.png"; // รูป default in frontend/public

  // Normalize src: treat 'null'/'None'/'undefined' strings as missing
  const missing = !src || src === 'null' || src === 'None' || src === 'undefined';

  // Vite env var for API base (set VITE_API_BASE_URL) or fallback
  const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://127.0.0.1:8000';

  let finalSrc = defaultAvatar;
  if (!missing) {
    // If src already looks absolute or root-relative, use as-is
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) {
      finalSrc = src;
    } else {
      // relative media path from backend, prefix with API base
      finalSrc = apiBase.replace(/\/$/, '') + '/' + src.replace(/^\//, '');
    }
  }

  return (
    <div
      className="rounded-full overflow-hidden border"
      style={{ width: size, height: size }}
    >
      <img
        src={finalSrc}
        alt="avatar"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
