import React, { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

  const handleEdit = (recipeId) => {
    navigate(`/edit/${recipeId}`);
  };

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
    <div className="page-container max-w-lg">
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="avatar avatar-lg" />
          ) : (
            <span className="avatar avatar-lg">{user.username?.[0]?.toUpperCase()}</span>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-green-700 mb-1">{user.username}</h2>
            <p className="text-gray-600 text-sm mb-3">{user.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button onClick={handleAvatarPick} disabled={uploadingAvatar} className="btn-secondary">
                {uploadingAvatar ? "Uploading..." : user.avatarUrl ? "Change photo" : "Add photo"}
              </button>
              {user.avatarUrl && (
                <button onClick={handleAvatarRemove} disabled={uploadingAvatar} className="btn-danger">
                  Remove
                </button>
              )}
            </div>
            {avatarError && <p className="text-red-600 text-sm mt-2">{avatarError}</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4">
          Recipes by {user.username}
        </h3>
        {recipes.length === 0 ? (
          <p className="text-gray-600">No recipes yet.</p>
        ) : (
          <ul className="space-y-3">
            {(Array.isArray(recipes) ? recipes : []).map((recipe) => (
              <li key={recipe._id} className="card-sm flex items-center justify-between gap-3">
                <span className="font-medium">{recipe.title}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(recipe._id)} className="btn-secondary">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(recipe._id)}
                    disabled={deletingId === recipe._id}
                    className="btn-danger"
                  >
                    {deletingId === recipe._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;
