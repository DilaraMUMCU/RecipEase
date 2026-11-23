import React, { createContext, useContext, useState, useMemo } from 'react';
import { RECIPES } from '../data/recipes';
import {
  searchMealsFromApi,
  fetchRandomMealFromApi,
  fetchPopularMealsFromApi,
} from '../services/recipeApiService';

const RecipeContext = createContext();

export function RecipeProvider({ children }) {
  // Live API Fetched Recipes State (from TheMealDB)
  const [apiRecipes, setApiRecipes] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiStatusMessage, setApiStatusMessage] = useState('');

  // Favorites State
  const [favorites, setFavorites] = useState(['1', '3']); // initial sample favorites for demo

  // Measurement System: 'Metric' (g, ml, kg) or 'Imperial' (oz, lbs, cups)
  const [measurementSystem, setMeasurementSystem] = useState('Metric');

  // User Profile Data (matching PDF slide 5)
  const [userProfile, setUserProfile] = useState({
    name: 'Sarah Martinez',
    email: 'sarah.martinez@email.com',
    language: 'English',
  });

  // Dietary Preferences State (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Low-Carb, Halal, Nut-Free)
  const [dietaryPreferences, setDietaryPreferences] = useState(['Vegetarian']);

  const toggleDietaryPreference = (pref) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  // Toggle favorite status
  const toggleFavorite = (recipeId) => {
    setFavorites((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  };

  const isFavorite = (recipeId) => favorites.includes(recipeId);

  // Universal Recipe Localization & Scaling Helper
  // Converts between Imperial and Metric, then scales by portion ratio
  const formatIngredientAmount = (ingredient, servings, baseServings) => {
    if (!ingredient || ingredient.amount === undefined || ingredient.amount === null) {
      return { amount: '', unit: ingredient?.unit || '' };
    }

    const ratio = servings / (baseServings || 4);
    let amount = ingredient.amount * ratio;
    let unit = ingredient.unit || '';

    // Unit conversion if needed
    if (measurementSystem === 'Imperial') {
      if (unit.toLowerCase() === 'g') {
        const oz = amount / 28.35;
        if (oz >= 16) {
          amount = oz / 16;
          unit = 'lbs';
        } else {
          amount = oz;
          unit = 'oz';
        }
      } else if (unit.toLowerCase() === 'ml') {
        amount = amount / 240;
        unit = 'cups';
      } else if (unit.toLowerCase() === 'kg') {
        amount = amount * 2.205;
        unit = 'lbs';
      }
    } else if (measurementSystem === 'Metric') {
      if (unit.toLowerCase().includes('cup') && !unit.toLowerCase().includes('kg')) {
        // approximate standard cup volume (240ml / ~125g flour or sugar)
        amount = amount * 200;
        unit = 'g';
      }
    }

    // Format fraction representation for readability
    if (Number.isInteger(amount)) {
      return { amount: amount.toString(), unit };
    }

    const rounded = Math.round(amount * 100) / 100;
    const whole = Math.floor(rounded);
    const fraction = rounded - whole;

    let fracStr = '';
    if (Math.abs(fraction - 0.25) < 0.04) fracStr = '1/4';
    else if (Math.abs(fraction - 0.33) < 0.05) fracStr = '1/3';
    else if (Math.abs(fraction - 0.5) < 0.04) fracStr = '1/2';
    else if (Math.abs(fraction - 0.66) < 0.05) fracStr = '2/3';
    else if (Math.abs(fraction - 0.75) < 0.04) fracStr = '3/4';

    if (fracStr) {
      return { amount: whole > 0 ? `${whole} ${fracStr}` : fracStr, unit };
    }

    return {
      amount: rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1).replace(/\.0$/, ''),
      unit,
    };
  };

  // ========================================================
  // TheMealDB Online API Methods
  // ========================================================

  // Fetch online recipes by keyword or title
  const searchApiRecipes = async (query) => {
    if (!query || !query.trim()) return [];
    setIsApiLoading(true);
    setApiError(null);
    setApiStatusMessage(`Searching TheMealDB for "${query.trim()}"...`);
    try {
      const results = await searchMealsFromApi(query);
      if (results.length > 0) {
        setApiRecipes((prev) => {
          const map = new Map();
          prev.forEach((r) => map.set(r.id, r));
          results.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
        setApiStatusMessage(`Found ${results.length} recipes from TheMealDB!`);
      } else {
        setApiStatusMessage(`No online recipes found for "${query.trim()}".`);
      }
      return results;
    } catch (err) {
      setApiError(err.message);
      setApiStatusMessage('Could not reach TheMealDB API. Check your connection.');
      return [];
    } finally {
      setIsApiLoading(false);
    }
  };

  // Fetch a surprise random recipe from TheMealDB
  const fetchRandomRecipe = async () => {
    setIsApiLoading(true);
    setApiError(null);
    setApiStatusMessage('Fetching surprise recipe from TheMealDB...');
    try {
      const meal = await fetchRandomMealFromApi();
      if (meal) {
        setApiRecipes((prev) => {
          const exists = prev.some((r) => r.id === meal.id);
          return exists ? prev : [meal, ...prev];
        });
        setApiStatusMessage(`Added "${meal.title}" to recipes!`);
        return meal;
      }
      return null;
    } catch (err) {
      setApiError(err.message);
      setApiStatusMessage('Failed to fetch random recipe.');
      return null;
    } finally {
      setIsApiLoading(false);
    }
  };

  // Fetch curated popular recipes from TheMealDB
  const fetchPopularApiRecipes = async () => {
    setIsApiLoading(true);
    setApiError(null);
    setApiStatusMessage('Fetching popular international recipes from TheMealDB...');
    try {
      const popular = await fetchPopularMealsFromApi();
      if (popular.length > 0) {
        setApiRecipes((prev) => {
          const map = new Map();
          prev.forEach((r) => map.set(r.id, r));
          popular.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
        setApiStatusMessage(`Loaded ${popular.length} recipes from TheMealDB!`);
      }
      return popular;
    } catch (err) {
      setApiError(err.message);
      return [];
    } finally {
      setIsApiLoading(false);
    }
  };

  // Combined Recipe Collection (Offline Base + Live API Fetched)
  const allRecipes = useMemo(() => {
    const map = new Map();
    RECIPES.forEach((r) => map.set(r.id, r));
    apiRecipes.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  }, [apiRecipes]);

  // Find recipes by given list of ingredients (AI Pantry Matching)
  const findMatchingRecipes = (availableIngredients) => {
    if (!availableIngredients || availableIngredients.length === 0) return [];

    const lowerInputs = availableIngredients.map((i) => i.toLowerCase().trim());

    return allRecipes
      .map((recipe) => {
        const matched = [];
        const missing = [];

        (recipe.ingredients || []).forEach((ing) => {
          const ingLower = (ing.name || '').toLowerCase();
          const hasMatch = lowerInputs.some((item) =>
            ingLower.includes(item) || item.includes(ingLower)
          );
          if (hasMatch) {
            matched.push(ing.name);
          } else {
            missing.push(ing.name);
          }
        });

        const ingCount = (recipe.ingredients && recipe.ingredients.length) || 1;
        const matchRate = Math.round((matched.length / ingCount) * 100);

        return {
          ...recipe,
          matchedCount: matched.length,
          matchedIngredients: matched,
          missingIngredients: missing,
          matchRate,
        };
      })
      .filter((r) => r.matchedCount > 0)
      .sort((a, b) => b.matchRate - a.matchRate);
  };

  const favoriteRecipes = useMemo(() => {
    return allRecipes.filter((r) => favorites.includes(r.id));
  }, [allRecipes, favorites]);

  return (
    <RecipeContext.Provider
      value={{
        recipes: allRecipes,
        apiRecipes,
        isApiLoading,
        apiError,
        apiStatusMessage,
        searchApiRecipes,
        fetchRandomRecipe,
        fetchPopularApiRecipes,
        favorites,
        favoriteRecipes,
        toggleFavorite,
        isFavorite,
        measurementSystem,
        setMeasurementSystem,
        userProfile,
        setUserProfile,
        dietaryPreferences,
        setDietaryPreferences,
        toggleDietaryPreference,
        formatIngredientAmount,
        findMatchingRecipes,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}
