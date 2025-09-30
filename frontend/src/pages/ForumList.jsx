import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/api";
import ActionButton from "../components/ActionButton";

// toggle value presence in an array (by strict equality)
const toggleInArray = (arr, val) => {
  if (!arr) return [val];
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
};

export default function ForumList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTag = searchParams.get('tag');
  const activeCategory = searchParams.get('category');
  const activeQuery = searchParams.get('q') || searchParams.get('search') || '';

  // support CSV multi-select params: ?tags=1,2&categories=3,4
  const activeTagsCSV = searchParams.get('tags');
  const activeCategoriesCSV = searchParams.get('categories');
  const activeTags = useMemo(() => (activeTagsCSV ? activeTagsCSV.split(',').filter(Boolean) : (activeTag ? [activeTag] : [])), [activeTagsCSV, activeTag]);
  const activeCategories = useMemo(() => (activeCategoriesCSV ? activeCategoriesCSV.split(',').filter(Boolean) : (activeCategory ? [activeCategory] : [])), [activeCategoriesCSV, activeCategory]);

  // multi-select state and lookup lists
  const [tagsList, setTagsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedTags, setSelectedTags] = useState(activeTags);
  const [selectedCategories, setSelectedCategories] = useState(activeCategories);
  const [query, setQuery] = useState(activeQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch posts whenever the URL search params change (so back/forward works)
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = {};
        // prefer CSV multi-value params (tags/categories), fallback to single tag/category
        const tagsParam = searchParams.get('tags') || searchParams.get('tag');
        const catsParam = searchParams.get('categories') || searchParams.get('category');
        const qParam = searchParams.get('q') || searchParams.get('search');
        if (tagsParam) params.tags = tagsParam;
        if (catsParam) params.categories = catsParam;
        if (qParam) params.q = qParam;

        const res = await API.get('/posts/', { params });
        setPosts(res.data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchParams]);

  // Keep local query state in sync with URL
  useEffect(() => {
    setQuery(activeQuery);
  }, [activeQuery]);

  // Debounce input -> update URL query param
  useEffect(() => {
    const t = setTimeout(() => {
      const params = {};
      // preserve existing tag/category params
      const tags = searchParams.get('tags') || searchParams.get('tag');
      const cats = searchParams.get('categories') || searchParams.get('category');
      if (tags) params.tags = tags;
      if (cats) params.categories = cats;
      if (query && query.trim() !== '') params.q = query.trim();
      setSearchParams(params);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fetch tag/category lists once for UI
  useEffect(() => {
    API.get('/tags/').then(r => setTagsList(r.data)).catch(() => {});
    API.get('/categories/').then(r => setCategoriesList(r.data)).catch(() => {});
  }, []);

  // keep selected state in sync when URL changes (so back/forward keeps selection)
  useEffect(() => {
    setSelectedTags(activeTags);
    setSelectedCategories(activeCategories);
  }, [activeTags, activeCategories]);

  const applyFilters = () => {
    const params = {};
    if (selectedTags && selectedTags.length) params.tags = selectedTags.join(',');
    if (selectedCategories && selectedCategories.length) params.categories = selectedCategories.join(',');
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCategories([]);
    setSearchParams({});
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        รายการกระทู้ทั้งหมด
      </h1>

      {/* Search by partial title */}
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Allow immediate submit on Enter (preserve existing tag/category filters)
            if (e.key === 'Enter') {
              e.preventDefault();
              const params = {};
              const tags = searchParams.get('tags') || searchParams.get('tag');
              const cats = searchParams.get('categories') || searchParams.get('category');
              if (tags) params.tags = tags;
              if (cats) params.categories = cats;
              if (query && query.trim() !== '') params.q = query.trim();
              setSearchParams(params);
            }
          }}
          placeholder="ค้นหาหัวข้อโพสต์"
          className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-700 dark:text-gray-300">กำลังโหลด...</p>
      ) : posts.length > 0 ? (
        <>
        {/* Filter controls and Active filters */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <ActionButton variant="outline" size="sm" onClick={() => setShowFilters(s => !s)}>{showFilters ? 'ปิดตัวกรอง' : 'ตัวกรอง'}</ActionButton>
            <div className="text-sm text-gray-600 dark:text-gray-300">เลือกหมวดหมู่หรือแท็กเพื่อกรองหลายรายการ</div>
          </div>

          {showFilters && (
            <div className="mb-3 p-3 border rounded bg-white dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold mb-2">แท็ก</div>
                  <div className="max-h-48 overflow-auto">
                    {tagsList.slice(0, 50).map(t => (
                      <label key={t.id} className="block text-sm">
                        <input type="checkbox" checked={selectedTags.includes(String(t.id))} onChange={() => setSelectedTags(prev => toggleInArray(prev, String(t.id)))} />
                        <span className="ml-2">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-2">หมวดหมู่</div>
                  <div className="max-h-48 overflow-auto">
                    {categoriesList.slice(0, 50).map(c => (
                      <label key={c.id} className="block text-sm">
                        <input type="checkbox" checked={selectedCategories.includes(String(c.id))} onChange={() => setSelectedCategories(prev => toggleInArray(prev, String(c.id)))} />
                        <span className="ml-2">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ActionButton variant="primary" size="sm" onClick={applyFilters}>ใช้ตัวกรอง</ActionButton>
                <ActionButton variant="outline" size="sm" onClick={clearFilters}>ล้าง</ActionButton>
              </div>
            </div>
          )}

          {(selectedTags.length > 0 || selectedCategories.length > 0 || activeTag || activeCategory) && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">ตัวกรอง:</span>
              {selectedCategories.length > 0 && selectedCategories.map(cId => (
                <span key={cId} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded text-sm">
                  หมวด: { (categoriesList.find(x => String(x.id) === String(cId))?.name) || decodeURIComponent(cId) }
                </span>
              ))}
              {selectedTags.length > 0 && selectedTags.map(tId => (
                <span key={tId} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                  แท็ก: { (tagsList.find(x => String(x.id) === String(tId))?.name) || tId }
                </span>
              ))}
              {/* fallback single params shown as well */}
              {activeCategory && !selectedCategories.length && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded text-sm">หมวด: {decodeURIComponent(activeCategory)}</span>
              )}
              {activeTag && !selectedTags.length && (
                <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">แท็ก: {activeTag}</span>
              )}
              <ActionButton variant="ghost" size="sm" onClick={clearFilters} className="ml-2 text-red-600 underline text-sm">ล้าง</ActionButton>
            </div>
          )}
        </div>
        <ul className="space-y-4">
          {posts.slice((currentPage - 1) * postsPerPage, (currentPage - 1) * postsPerPage + postsPerPage).map((post) => {
            // post.image may be a string or an object with `url`
            const imageUrl = post.image ? (typeof post.image === "string" ? post.image : post.image.url) : null;
            return (
              <li
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/thread/${post.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/thread/${post.id}`);
                }}
                className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {imageUrl ? (
                    <div className="flex-shrink-0">
                      <img src={imageUrl} alt={post.title || "post image"} className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover rounded-md" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center text-sm text-gray-600">ไม่มีรูป</div>
                  )}

                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{post.title}</h2>

                    {/* Category */}
                            {post.category && (
                              <div className="mt-2">
                                                <Link
                                                  to={`/forum?category=${encodeURIComponent(post.category.name)}`}
                                                  onClick={(e) => e.stopPropagation()}
                                                  onKeyDown={(e) => e.stopPropagation()}
                                                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded text-sm"
                                                >
                                                  {post.category.name}
                                                </Link>
                              </div>
                            )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-2">
                                <div className="flex flex-wrap gap-2">
                                  {post.tags.map(t => (
                                    <Link
                                      key={t.id}
                                      to={`/forum?tag=${t.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm"
                                    >
                                      {t.name}
                                    </Link>
                                  ))}
                                </div>
                      </div>
                    )}

                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                      {post.body && post.body.length > 150 ? post.body.slice(0, 150) + "..." : post.body}
                    </p>

                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-2">โพสต์โดย {post.user?.username || "Anonymous"}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Pagination controls */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          <ActionButton variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>ก่อนหน้า</ActionButton>

          {Array.from({ length: Math.max(1, Math.ceil(posts.length / postsPerPage)) }).map((_, idx) => {
            const page = idx + 1;
            return (
              <ActionButton key={page} size="sm" variant={currentPage === page ? 'primary' : 'outline'} onClick={() => setCurrentPage(page)}>{page}</ActionButton>
            );
          })}

          <ActionButton variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(Math.ceil(posts.length / postsPerPage), p + 1))} disabled={currentPage === Math.ceil(posts.length / postsPerPage) || posts.length === 0}>ถัดไป</ActionButton>
        </div>
        </>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">ยังไม่มีกระทู้</p>
      )}

      
    </div>
  );
}
