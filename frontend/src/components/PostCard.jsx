import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <div className="post-card">
      <li className="border rounded-lg p-4 bg-white hover:shadow-card hover:scale-105 transition transform duration-200">
  <Link to={`/thread/${post.id}`}>
    <h2 className="text-lg font-semibold text-primary hover:underline">{post.title}</h2>
  </Link>
  {/* Thumbnail if available (accepts string URL or object with url) */}
  {(post.image?.url || post.image) && (
    <img src={post.image?.url || post.image} alt={post.title} className="w-full h-40 object-cover rounded mt-2 mb-2" />
  )}
  <p className="text-secondary-dark text-sm mt-1">{post.body.slice(0,120)}...</p>
</li>
    </div>
  );
}
