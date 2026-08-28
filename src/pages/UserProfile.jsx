import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import FollowButton from "../components/FollowButton";
import BlockButton from "../components/BlockButton";
import ReportButton from "../components/ReportButton";

const UserProfile = () => {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [startingConversation, setStartingConversation] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, recipesRes] = await Promise.all([
          API.get(`/users/${id}`),
          API.get(`/recipes/user/${id}`, { params: { page: 1 } }),
        ]);
        if (cancelled) return;
        setProfile(profileRes.data);
        setRecipes(recipesRes.data.recipes);
        setPage(1);
        setHasMore(recipesRes.data.hasMore);
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (!cancelled) setError("Couldn't load this profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await API.get(`/recipes/user/${id}`, { params: { page: nextPage } });
      setRecipes((prev) => [...prev, ...res.data.recipes]);
      setPage(nextPage);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Failed to load more recipes:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowerCountChange = (delta) => {
    setProfile((prev) => (prev ? { ...prev, followerCount: prev.followerCount + delta } : prev));
  };

  const handleMessage = async () => {
    setStartingConversation(true);
    try {
      const res = await API.post("/conversations", { userId: profile._id });
      navigate(`/messages/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start conversation.");
    } finally {
      setStartingConversation(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!profile) return null;

  const isOwnProfile = authUser && authUser._id === profile._id;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-700">{profile.username}</h1>
            <div className="flex gap-4 text-gray-600 text-sm mt-2">
              <span><strong>{profile.recipeCount}</strong> recipes</span>
              <span><strong>{profile.followerCount}</strong> followers</span>
              <span><strong>{profile.followingCount}</strong> following</span>
            </div>
          </div>
          {isOwnProfile ? (
            <Link to="/profile" className="px-4 py-1.5 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
              Manage your recipes
            </Link>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <FollowButton
                  userId={profile._id}
                  initialFollowingByMe={profile.followingByMe}
                  onFollowerCountChange={handleFollowerCountChange}
                />
                <button
                  onClick={handleMessage}
                  disabled={startingConversation}
                  className="px-4 py-1.5 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                >
                  {startingConversation ? "..." : "Message"}
                </button>
              </div>
              <div className="flex gap-3">
                <BlockButton userId={profile._id} />
                <ReportButton targetType="user" targetId={profile._id} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-gray-600">No recipes yet.</p>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {recipes.map((recipe) => (
                <Link
                  to={`/recipes/${recipe._id}`}
                  key={recipe._id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col"
                >
                  <h3 className="text-lg font-semibold mb-2">{recipe.title}</h3>
                  <p className="text-gray-600 text-sm flex-1">{recipe.instructions?.slice(0, 100)}...</p>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
