import { useEffect, useState } from "react";
import API from "../services/api";

// Shared by CreateRecipe and EditRecipe - both need the same static
// category list for their dropdown.
const useCategories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    API.get("/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  return categories;
};

export default useCategories;
