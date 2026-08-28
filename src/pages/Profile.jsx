import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import RecipeCard from "../components/RecipeCard";

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (authUser && authUser._id) {
          setUser(authUser);
          const recipesRes = await API.get("/recipes/mine");
          setRecipes(recipesRes.data.recipes || []);
        } else {
          setRecipes([]);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setRecipes([]);
      }
    };

    if (authUser && authUser._id) {
      fetchUserProfile();
    }
  }, [authUser]);

  // Keep the local copy in sync whenever the shared auth user changes
  // (e.g. right after an avatar upload updates it).
  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  const handleDelete = async (recipeId) => {
    setDeletingId(recipeId);
    try {
      await API.delete(`/recipes/${recipeId}`);
      setRecipes((prevRecipes) =>
        prevRecipes.filter((recipe) => recipe._id !== recipeId)
      );
    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image exceeds 8MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingAvatar(true);
    try {
      const res = await API.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ avatarUrl: res.data.avatarUrl });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setAvatarError(err.response?.data?.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      await API.delete("/users/me/avatar");
      updateUser({ avatarUrl: null });
    } catch (err) {
      console.error("Failed to remove avatar:", err);
      setAvatarError(err.response?.data?.message || "Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return <div className="page-container text-center text-gray-600">Loading profile...</div>;

  return (
    <div className="page-container max-w-4xl">
      <div className="card mb-6 max-w-lg">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleAvatarPick}
            disabled={uploadingAvatar}
            className="avatar-upload"
            aria-label={user.avatarUrl ? "Change profile picture" : "Add a profile picture"}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="avatar avatar-lg" />
            ) : (
              <span className="avatar avatar-lg">{user.username?.[0]?.toUpperCase()}</span>
            )}
            <span className="avatar-upload__overlay" aria-hidden="true">
              <span>📷</span>
              <span>{uploadingAvatar ? "Uploading…" : user.avatarUrl ? "Change" : "Add"}</span>
            </span>
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-green-700 mb-1">{user.username}</h2>
            <p className="text-gray-600 text-sm mb-3">{user.email}</p>
            {user.avatarUrl && (
              <button
                onClick={handleAvatarRemove}
                disabled={uploadingAvatar}
                className="text-sm text-red-600 hover:underline disabled:opacity-60"
              >
                Remove photo
              </button>
            )}
            {avatarError && <p className="text-red-600 text-sm mt-2">{avatarError}</p>}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">
        Recipes by {user.username}
      </h3>
      {recipes.length === 0 ? (
        <p className="text-gray-600">No recipes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(Array.isArray(recipes) ? recipes : []).map((recipe) => (
            <RecipeCard
              key={recipe._id}
              recipe={recipe}
              actions={
                <>
                  <Link to={`/edit/${recipe._id}`} className="btn-secondary flex-1">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(recipe._id)}
                    disabled={deletingId === recipe._id}
                    className="btn-danger flex-1"
                  >
                    {deletingId === recipe._id ? "Deleting..." : "Delete"}
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
