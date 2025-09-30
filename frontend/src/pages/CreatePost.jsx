import { useState, useEffect, useContext } from "react";
import API from "../api/api";
import ActionButton from "../components/ActionButton";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]); 
  const [allTags, setAllTags] = useState([]);

  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);

  // โหลด categories & tags
  useEffect(() => {
    API.get("/categories/").then(res => setCategories(res.data));
    API.get("/tags/").then(res => setAllTags(res.data));
  }, []);

  // Select category
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setCategoryInput(cat.name);
  };

  // Create a new category immediately and select it
  const handleCreateCategory = async () => {
    if (!categoryInput || !categoryInput.trim()) return;
    try {
      const res = await API.post("/categories/", { name: categoryInput.trim() });
      setCategories(prev => [...prev, res.data]);
      setSelectedCategory(res.data);
    } catch (err) {
      // if it already exists or other error, try refetch
      if (err?.response?.status === 400) {
        const r = await API.get("/categories/");
        setCategories(r.data);
        const pick = r.data.find(c => String(c.name).toLowerCase() === String(categoryInput).trim().toLowerCase());
        if (pick) setSelectedCategory(pick);
      } else {
        console.error(err);
        alert('ไม่สามารถสร้างหมวดหมู่ได้');
      }
    }
  };

  // Add / remove tags
  const handleAddTag = async (tag) => {
    if (tags.length >= 5) return alert("สามารถเพิ่มได้ไม่เกิน 5 tag");

    // If tag already has an id, it's an existing tag from allTags
    if (tag.id) {
      if (!tags.find(t => t.name === tag.name)) setTags([...tags, tag]);
      setTagInput("");
      return;
    }

    // Otherwise try to persist the tag to backend
    try {
      const res = await API.post('/tags/', { name: tag.name });
      const created = res.data;
      // add to allTags if not present
      setAllTags(prev => (prev.find(t => t.id === created.id) ? prev : [created, ...prev]));
      // add to selected tags
      if (!tags.find(t => t.id === created.id)) setTags([...tags, created]);
      setTagInput("");
    } catch (err) {
      console.error(err);
      // fallback to a local tag object so user can continue
      const newTag = { id: `new-${tag.name}`, name: tag.name };
      if (!allTags.find(t => t.name === newTag.name)) setAllTags([newTag, ...allTags]);
      if (!tags.find(t => t.name === newTag.name)) setTags([...tags, newTag]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagName) => setTags(tags.filter(t => t.name !== tagName));

  // Submit post
  const handleSubmit = async (e) => {
    e.preventDefault();
    let formErrors = {};
  // Allow creating a post with only an image: title/body are optional if imageFile present
  if (!title && !imageFile) formErrors.title = "กรุณากรอกชื่อกระทู้หรือใส่รูปภาพ";
  if (!body && !imageFile) formErrors.body = "กรุณากรอกเนื้อหาหรือใส่รูปภาพ";
    if (!categoryInput) formErrors.category = "กรุณาใส่หมวดหมู่";
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      let categoryId = selectedCategory?.id;
      if (!categoryId) {
        // First try to find a category with the same name (case-insensitive)
        const found = categories.find(c => String(c.name).toLowerCase() === String(categoryInput).trim().toLowerCase());
        if (found) {
          categoryId = found.id;
        } else {
          // Try creating it; handle 400 (race / already exists) by refetching categories
          try {
            const res = await API.post("/categories/", { name: categoryInput });
            categoryId = res.data.id;
            setCategories(prev => [...prev, res.data]);
          } catch (err) {
            // If creation failed because it already exists (race), reload categories and pick the matching one
            if (err?.response?.status === 400) {
              try {
                const r = await API.get("/categories/");
                setCategories(r.data);
                const pick = r.data.find(c => String(c.name).toLowerCase() === String(categoryInput).trim().toLowerCase());
                if (pick) {
                  categoryId = pick.id;
                } else {
                  // Re-throw to be handled by outer catch
                  throw err;
                }
              } catch {
                throw err;
              }
            } else {
              throw err;
            }
          }
        }
      }

      const data = new FormData();
      data.append("user", user.id);
      data.append("title", title);
      data.append("body", body);
      data.append("category", categoryId);
      data.append("tags", JSON.stringify(tags.map(t => ({ name: t.name }))));
      if (imageFile) data.append("image", imageFile);

  await API.post("/posts/", data);

      navigate("/forum");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้างโพสต์");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">สร้างกระทู้ใหม่</h1>
          <ActionButton variant="outline" onClick={() => navigate(-1)} aria-label="ปิด">×</ActionButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">ชื่อกระทู้</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">หมวดหมู่</label>
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setSelectedCategory(null);
              }}
              placeholder="เลือกหมวดหมู่หรือพิมพ์ใหม่"
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.category ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              {/* Category suggestions (only when typing and no category selected) */}
              {categoryInput && categoryInput.trim() !== '' && !selectedCategory && (
                <div className="mt-2 border rounded bg-white dark:bg-gray-700">
                  {categories.filter(c => c.name.toLowerCase().includes(categoryInput.trim().toLowerCase())).length > 0 ? (
                    categories
                      .filter(c => c.name.toLowerCase().includes(categoryInput.trim().toLowerCase()))
                      .slice(0, 6)
                      .map(c => (
                          <div key={c.id} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-100" onClick={() => handleCategorySelect(c)}>
                            {c.name}
                          </div>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-600">ไม่มีหมวดหมู่ที่ตรงกัน</div>
                  )}
                  <div className="px-3 py-2 border-t flex items-center justify-between">
                    <small className="text-xs text-gray-500 dark:text-gray-300">หรือสร้างหมวดหมู่นี้</small>
                    <ActionButton variant="ghost" size="sm" onClick={handleCreateCategory}>สร้าง</ActionButton>
                  </div>
                </div>
              )}
              {!categoryInput && categories.length > 0 && !selectedCategory && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.slice(0, 8).map(c => (
                    <ActionButton key={c.id} variant="ghost" size="sm" onClick={() => handleCategorySelect(c)}>{c.name}</ActionButton>
                  ))}
                </div>
              )}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">แท็ก</label>
            <div className="flex flex-wrap gap-2 mb-1">
              {tags.map((t) => (
                <span key={t.name} className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                  {t.name}
                  <ActionButton variant="ghost" size="sm" onClick={() => handleRemoveTag(t.name)} className="ml-2 text-white">×</ActionButton>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="พิมพ์ tag แล้วกด Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (tagInput.trim()) handleAddTag({ name: tagInput.trim() });
                }
              }}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
              {/* Tag suggestions from allTags (and create new tag option) */}
              {tagInput && tagInput.trim() !== '' && tags.length < 5 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {allTags
                      .filter(t => t.name.toLowerCase().includes(tagInput.trim().toLowerCase()) && !tags.find(x => x.name === t.name))
                      .slice(0, 8)
                      .map(t => (
              <ActionButton key={t.id} variant="ghost" size="sm" onClick={() => handleAddTag(t)}>{t.name}</ActionButton>
                      ))}
                  </div>
                  {/* If no matching existing tags, offer to create this tag locally */}
                  {allTags.filter(t => t.name.toLowerCase().includes(tagInput.trim().toLowerCase()) && !tags.find(x => x.name === t.name)).length === 0 && (
                    <div className="mt-2 px-3 py-2 border rounded flex items-center justify-between bg-white dark:bg-gray-800">
                      <small className="text-sm text-gray-700 dark:text-gray-300">สร้างแท็กใหม่:</small>
                      <ActionButton variant="ghost" size="sm" onClick={() => { if (tagInput.trim()) handleAddTag({ name: tagInput.trim() }); }}>สร้าง "{tagInput.trim()}"</ActionButton>
                    </div>
                  )}
                </div>
              )}
              {/* If no input, show popular/existing tags as suggestions (click to add) */}
              {!tagInput && allTags.length > 0 && tags.length < 5 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {allTags
                    .filter(t => !tags.find(x => x.name === t.name))
                    .slice(0, 12)
                    .map(t => (
                      <ActionButton key={t.id} variant="ghost" size="sm" onClick={() => handleAddTag(t)}>{t.name}</ActionButton>
                    ))}
                </div>
              )}
          </div>

          {/* Body */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">เนื้อหา</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.body ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body}</p>}
          </div>

          {/* Image upload */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">รูปภาพ (เลือกจากเครื่อง)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0] || null)}
              className="w-full text-gray-900 dark:text-gray-100"
            />
            {imageFile && <p className="text-sm mt-1">เลือกไฟล์: {imageFile.name}</p>}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              สร้างกระทู้
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
