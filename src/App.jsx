import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";

// Route-based code splitting: everything except Home (which nearly every
// visitor loads first) is fetched on demand, so a first-time visit doesn't
// pay for CreateRecipe/EditRecipe/comment UI/etc. it may never use.
const Explore = lazy(() => import("./pages/Explore"));
const Feed = lazy(() => import("./pages/Feed"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const CreateRecipe = lazy(() => import("./pages/CreateRecipe"));
const EditRecipe = lazy(() => import("./pages/EditRecipe"));
const YourRecipes = lazy(() => import("./pages/YourRecipes"));
const SavedRecipes = lazy(() => import("./pages/SavedRecipes"));
const PopularMeals = lazy(() => import("./pages/PopularMeals"));
const RandomMeal = lazy(() => import("./pages/RandomMeal"));
const MealDetail = lazy(() => import("./pages/MealDetail"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="p-8 text-center text-gray-500">Loading...</div>
);

function App() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/search" element={<SearchResults />} />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
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
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
