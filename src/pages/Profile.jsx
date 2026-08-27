import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (authUser && authUser._id) {
          // Fetch user info if needed
          setUser(authUser);
          // Fetch recipes using full API URL
          const recipesRes = await API.get(`/recipes/user/${authUser._id}`);
          setRecipes(Array.isArray(recipesRes.data) ? recipesRes.data : []);
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

  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg mb-8">
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          {user.username}'s Profile
        </h2>
        <p className="mb-2">Email: {user.email}</p>
      </div>
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-4">
          Recipes by {user.username}
        </h3>
        <ul>
          {(Array.isArray(recipes) ? recipes : []).map((recipe) => (
            <li key={recipe._id}>
              {recipe.title}
              {/* Edit Button */}
              <button onClick={() => handleEdit(recipe._id)}>Edit</button>
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(recipe._id)}
                disabled={deletingId === recipe._id}
              >
                {deletingId === recipe._id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
