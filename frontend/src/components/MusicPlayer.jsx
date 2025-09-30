import { useState, useRef, useEffect, useCallback } from "react";

export default function MusicPlayer() {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files).filter(f => f.type.startsWith("audio/"));
    const newSongs = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      url: URL.createObjectURL(file),
    }));
    setPlaylist(prev => [...prev, ...newSongs]);
    if (!currentSong && newSongs.length > 0) setCurrentSong(newSongs[0]);
  };

  const playPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const nextSong = useCallback(() => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
  }, [playlist, currentSong]);

  const prevSong = useCallback(() => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentSong(playlist[prevIndex]);
  }, [playlist, currentSong]);

  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => nextSong();

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, nextSong]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.url;
      audioRef.current.volume = volume;
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentSong, volume, isPlaying]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-inner">
      <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-100">🎵 เครื่องเล่นเพลง</h3>

      <input
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-100 mb-4"
      />

      <audio ref={audioRef} />

      {currentSong && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {currentSong.name}
          </div>

          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={prevSong} disabled={playlist.length === 0} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>

        <button onClick={playPause} disabled={!currentSong} className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button onClick={nextSong} disabled={playlist.length === 0} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {playlist.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            เพลย์ลิสต์ ({playlist.length} เพลง)
          </h4>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {playlist.map(song => (
              <li
                key={song.id}
                onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                className={`text-xs p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentSong?.id === song.id 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="truncate">{song.name}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
