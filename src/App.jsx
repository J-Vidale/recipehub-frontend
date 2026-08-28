import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import CreateRecipe from "./pages/CreateRecipe";
import EditRecipe from "./pages/EditRecipe";
import YourRecipes from "./pages/YourRecipes";
import SavedRecipes from "./pages/SavedRecipes";
import PopularMeals from "./pages/PopularMeals";
import RandomMeal from "./pages/RandomMeal";
import MealDetail from "./pages/MealDetail";
import RecipeDetail from "./pages/RecipeDetail";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateRecipe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <EditRecipe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/your-recipes"
            element={
              <ProtectedRoute>
                <YourRecipes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-recipes"
            element={
              <ProtectedRoute>
                <SavedRecipes />
              </ProtectedRoute>
            }
          />
          <Route path="/popular-meals" element={<PopularMeals />} />
          <Route path="/random-meal" element={<RandomMeal />} />
          <Route path="/meals/:id" element={<MealDetail />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;
