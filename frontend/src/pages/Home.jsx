// src/pages/Home.jsx
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import Avatar from "../components/Avatar";
import ReportButton from "../components/ReportButton.jsx";
import { AuthContext } from "../context/AuthProvider";
import Calendar from "../components/Calendar";
import MusicPlayer from "../components/MusicPlayer";

export default function Home() {
  const navigate = useNavigate();
  // ----- Posts & Tags -----
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [popularPosts, setPopularPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [currentPage] = useState(1); // pagination
  const postsPerPage = 5;

  // ----- Music Player -----
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // ----- Calendar -----
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);

  // ---------- Fetch Data ----------
  const fetchData = async () => {
    try {
      const postsRes = await API.get("posts/").catch(err => (err.response?.status === 401 ? { data: [] } : Promise.reject(err)));
      setPosts(postsRes.data);
      setPostsCount(postsRes.data.length);

      const popularPostsRes = await API.get("posts/popular/").catch(() => ({ data: [] }));
      setPopularPosts(popularPostsRes.data);

      const popularTagsRes = await API.get("tags/popular/").catch(() => ({ data: [] }));
      setPopularTags(popularTagsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Prevent double-fetch in React StrictMode (dev) where effects mount/unmount/remount.
  // Use a module-scoped flag so the fetch and interval are only set up once per full page load.
  // This avoids duplicate identical network requests showing up in the server logs.
  if (typeof window !== 'undefined' && !window.__mini_forum_home_initialized) {
    window.__mini_forum_home_initialized = true;
    // run initial fetch and start interval
    fetchData();
    const intervalId = setInterval(fetchData, 60000);
    // store interval id so it can be cleared if the user performs a hard navigation/reload
    window.__mini_forum_home_interval = intervalId;
  }

  useEffect(() => {
    // If the page is unloaded (hard navigation), clear any interval we set on the window
    return () => {
      try {
        if (window.__mini_forum_home_interval) {
          clearInterval(window.__mini_forum_home_interval);
          window.__mini_forum_home_interval = null;
          window.__mini_forum_home_initialized = false;
        }
      } catch {
        // ignore
      }
    };
  }, []);

  // ---------- Pagination ----------
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  // ---------- Calendar ----------
  useEffect(() => {
    if (selectedDate) {
      setFadeOut(false);
      const fadeTimer = setTimeout(() => setFadeOut(true), 4000);
      const resetTimer = setTimeout(() => {
        setSelectedDate(null);
        setFadeOut(false);
      }, 5000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [selectedDate]);

  useEffect(() => setSelectedDate(null), [currentDate]);

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));



  // ---------- Music Player ----------
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
    const newSongs = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      url: URL.createObjectURL(file)
    }));
    setPlaylist(prev => [...prev, ...newSongs]);
    if (!currentSong && newSongs.length) setCurrentSong(newSongs[0]);
  };

  const playPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const nextSong = useCallback(() => {
    if (!playlist.length) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
    setCurrentSong(playlist[(currentIndex + 1) % playlist.length]);
  }, [playlist, currentSong]);

  const prevSong = useCallback(() => {
    if (!playlist.length) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
    setCurrentSong(currentIndex === 0 ? playlist[playlist.length - 1] : playlist[currentIndex - 1]);
  }, [playlist, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => nextSong();

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSong, nextSong]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.url;
      audioRef.current.volume = volume;
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentSong, volume, isPlaying]);

  // ---------- Render ----------
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-8 shadow-lg text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">TALKING ROOM</h1>
        <p className="text-lg md:text-xl mb-4">ชุมชนแลกเปลี่ยนความรู้และความคิดเห็น</p>
        <Link to="/forum" className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition">เข้าห้องกระทู้</Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main posts */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">กระทู้ล่าสุด</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">มีกระทู้ทั้งหมด <b>{postsCount}</b> กระทู้</p>

          {currentPosts.length ? (
            <ul className="space-y-4">
              {currentPosts.map(post => {
                const imageUrl = post.image ? (typeof post.image === 'string' ? post.image : post.image.url) : null;
                return (
                  <li
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/thread/${post.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/thread/${post.id}`); }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer"
                  >
                      <div className="flex items-start gap-4">
                        {imageUrl ? (
                          <div className="flex-shrink-0">
                            <img src={imageUrl} alt={post.title || 'post image'} className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover rounded-md" />
                          </div>
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center text-sm text-gray-600">ไม่มีรูป</div>
                        )}

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{post.title}</h3>
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

                            {/* Tags (separate line) */}
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

                            <p className="text-gray-700 dark:text-gray-300 mt-2">{post.body ? (post.body.slice(0,120) + (post.body.length > 120 ? '...' : '')) : ''}</p>
                          <div className="flex items-center mt-3 text-gray-500 dark:text-gray-400 text-sm justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar src={post.user?.avatar} size={32} />
                              <span>โพสต์โดย {post.user?.username || "Anonymous"}</span>
                            </div>
                            <ReportButton targetId={post.id} targetType="post" ownerId={post.user?.id} currentUserId={user?.id} />
                          </div>
                        </div>
                      </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-gray-700 dark:text-gray-300">ยังไม่มีกระทู้</p>}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col space-y-6">

          {/* Popular Posts & Tags Container */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-4 space-y-4">

            {/* Popular Posts */}
            <div>
              <h3 className="text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">กระทู้ยอดนิยม</h3>
              <ul className="space-y-1 text-sm">
                {popularPosts.length ? popularPosts.map(post => (
                  <li key={post.id}>
                    <Link to={`/thread/${post.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {post.title.length > 30 ? post.title.slice(0,30) + "..." : post.title}
                    </Link>
                  </li>
                )) : <li>ไม่มีข้อมูล</li>}
              </ul>
            </div>

            {/* Popular Tags */}
            <div>
              <h3 className="text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">แท็กยอดนิยม</h3>
              <ul className="space-y-1 text-sm">
                {popularTags.length ? popularTags.map(tag => (
                  <li key={tag.id}>
                    <Link to={`/forum?tag=${tag.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {tag.name}
                    </Link>
                  </li>
                )) : <li>ไม่มีข้อมูล</li>}
              </ul>
            </div>

            {/* Calendar */}
            <div>
              <h3 className="text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">ปฏิทิน</h3>
              <Calendar
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                fadeOut={fadeOut}
                onPrevMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
              />
            </div>
          </div>

          {/* Music Player - Bottom */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-4 mt-auto">
            <h3 className="text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">เครื่องเล่นเพลง</h3>
            <MusicPlayer
              currentSong={currentSong}
              playlist={playlist}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              audioRef={audioRef}
              onPlayPause={playPause}
              onNext={nextSong}
              onPrev={prevSong}
              onUpload={handleFileUpload}
              onVolumeChange={setVolume}
              onSelectSong={setCurrentSong}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
