// TheMealDB Public Recipe API Integration Service for RecipEase
// Connects to TheMealDB's open REST API, parses ingredients, measurements,
// instructions, and infers dietary categories and smart substitution choices.

const THEMEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Comprehensive culinary substitute mappings for API ingredients
const SUBSTITUTE_DICTIONARY = {
  chicken: 'Turkey breast, sliced pork, or firm tofu',
  beef: 'Ground turkey, chicken strips, or portobello mushrooms',
  pork: 'Turkey bacon, chicken sausage, or smoked tempeh',
  bacon: 'Turkey bacon, prosciutto, or smoked tempeh',
  salmon: 'Trout fillet, cod, or firm tofu steak',
  fish: 'Cod fillet, haddock, or sea bass',
  shrimp: 'Scallops, calamari, or king oyster mushrooms',
  prawns: 'Jumbo scallops or sliced king oyster mushrooms',
  butter: 'Clarified butter (Ghee), margarine, or extra virgin olive oil',
  milk: 'Almond milk, oat milk, or soy milk',
  cream: 'Coconut cream, Greek yogurt, or evaporated milk',
  cheese: 'Vegan mozzarella, nutritional yeast, or mild provolone',
  parmesan: 'Pecorino Romano, nutritional yeast, or Grana Padano',
  mozzarella: 'Provolone, bocconcini, or vegan mozzarella',
  cheddar: 'Colby jack, gouda, or sharp nutritional yeast',
  egg: 'Flax eggs (1 tbsp ground flax + 3 tbsp water), applesauce, or chia gel',
  eggs: 'Flax eggs, applesauce, or silken tofu',
  flour: 'Gluten-free 1-to-1 flour, oat flour, or almond flour',
  sugar: 'Honey, pure maple syrup, or stevia extract',
  garlic: 'Garlic powder (1/4 tsp per clove), shallots, or chopped chives',
  onion: 'Shallots, leeks, or spring green onions',
  rice: 'Cauliflower rice, quinoa, or pearl couscous',
  pasta: 'Zucchini noodles, chickpea pasta, or rice noodles',
  spaghetti: 'Zucchini spirals or gluten-free spaghetti',
  oil: 'Canola oil, sunflower oil, or light olive oil',
  'olive oil': 'Avocado oil, grapeseed oil, or canola oil',
  tomato: 'Canned crushed tomatoes, tomato puree, or roasted bell pepper puree',
  tomatoes: 'Canned diced tomatoes, marinara sauce, or bell peppers',
  lemon: 'Lime juice, apple cider vinegar, or white wine vinegar',
  lime: 'Lemon juice or white wine vinegar',
  potato: 'Sweet potatoes, turnip, or mashed cauliflower',
  potatoes: 'Sweet potatoes or parsnips',
  carrot: 'Parsnips, bell peppers, or sweet potato strips',
  carrots: 'Parsnips, zucchini, or butternut squash',
  'soy sauce': 'Tamari (gluten-free), coconut aminos, or liquid aminos',
  mayonnaise: 'Greek yogurt, mashed avocado, or vegan mayo',
  vinegar: 'Apple cider vinegar, lemon juice, or white wine vinegar',
  yogurt: 'Coconut yogurt, sour cream, or silken tofu',
  ginger: 'Ground ginger (1/4 tsp per tbsp fresh) or galangal',
  cilantro: 'Flat-leaf parsley, fresh basil, or mint',
  parsley: 'Cilantro, chervil, or chopped celery leaves',
  mushroom: 'Cremini mushrooms, button mushrooms, or zucchini slices',
  mushrooms: 'Portobello strips, cremini, or king oyster mushrooms',
  bread: 'Gluten-free bread, sourdough, or corn tortillas',
  noodle: 'Rice noodles, zucchini noodles, or konjac noodles',
  noodles: 'Rice vermicelli, zucchini spirals, or soba noodles',
};

// Parse ingredient measurements like "2 cups", "1/2 tsp", "100g", "1 1/2 tbsp"
function parseMeasurement(measureStr) {
  if (!measureStr || typeof measureStr !== 'string') {
    return { amount: 1, unit: 'portion' };
  }
  const trimmed = measureStr.trim();
  if (!trimmed) return { amount: 1, unit: 'portion' };

  // Mixed fractions: "1 1/2 cups"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const denom = parseFloat(mixedMatch[3]);
    const unit = mixedMatch[4]?.trim() || '';
    return { amount: Math.round((whole + num / denom) * 100) / 100, unit };
  }

  // Simple fractions: "1/2 tsp", "3/4 cup"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const denom = parseFloat(fractionMatch[2]);
    const unit = fractionMatch[3]?.trim() || '';
    return { amount: Math.round((num / denom) * 100) / 100, unit };
  }

  // Numbers with decimal/unit: "250g", "2.5 cups", "3 tbsp"
  const numberMatch = trimmed.match(/^([\d.,]+)\s*(.*)$/);
  if (numberMatch) {
    const num = parseFloat(numberMatch[1].replace(',', '.'));
    const unit = numberMatch[2]?.trim() || '';
    if (!isNaN(num) && num > 0) {
      return { amount: num, unit: unit || 'portion' };
    }
  }

  return { amount: 1, unit: trimmed };
}

// Find smart kitchen substitute
function getSmartSubstitute(ingredientName) {
  if (!ingredientName) return 'Standard pantry alternative';
  const lower = ingredientName.toLowerCase().trim();

  for (const [key, sub] of Object.entries(SUBSTITUTE_DICTIONARY)) {
    if (lower.includes(key) || key.includes(lower)) {
      return sub;
    }
  }

  return 'Standard pantry alternative or common cooking substitute';
}

// Clean and split raw API instructions into distinct cooking steps
function parseSteps(instructions) {
  if (!instructions || typeof instructions !== 'string') {
    return ['Follow standard preparation and cooking guidelines for this recipe.'];
  }

  const rawLines = instructions
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const cleanSteps = [];
  for (const line of rawLines) {
    const cleaned = line.replace(/^(?:step\s*\d+[:.-]?|\d+[.):\-\]]+|\[\d+\])\s*/i, '').trim();
    if (cleaned.length > 8) {
      cleanSteps.push(cleaned);
    }
  }

  // Handle single dense text block without newline breaks
  if (cleanSteps.length <= 1 && instructions.length > 120) {
    const sentences = instructions
      .replace(/([.?!])\s+(?=[A-Z0-9])/g, '$1|')
      .split('|')
      .map((s) => s.trim().replace(/^(?:step\s*\d+[:.-]?|\d+[.):\-\]]+|\[\d+\])\s*/i, ''))
      .filter((s) => s.length > 12);
    if (sentences.length > 1) {
      return sentences;
    }
  }

  return cleanSteps.length > 0 ? cleanSteps : [instructions.trim()];
}

// Estimate calorie count based on category and ingredients
function estimateCalories(category, ingredientCount) {
  const cat = (category || '').toLowerCase();
  let base = 420;
  if (cat.includes('dessert')) base = 380;
  else if (cat.includes('seafood')) base = 350;
  else if (cat.includes('vegetarian')) base = 320;
  else if (cat.includes('vegan')) base = 290;
  else if (cat.includes('beef') || cat.includes('lamb') || cat.includes('pork')) base = 510;
  else if (cat.includes('chicken')) base = 440;
  else if (cat.includes('pasta')) base = 460;

  return base + ((ingredientCount || 5) % 5) * 15;
}

// Infer dietary categories from ingredients and category
function inferDietaryTags(category, ingredients) {
  const tags = [];
  const cat = (category || '').toLowerCase();
  const allIngText = (ingredients || []).map((i) => i.name.toLowerCase()).join(' ');

  const hasPork = /(?:pork|bacon|ham|prosciutto|lard|chorizo)/i.test(allIngText);
  const hasAlcohol = /(?:wine|beer|rum|vodka|brandy|bourbon|whiskey|sake)/i.test(allIngText);
  const hasMeat = /(?:chicken|beef|pork|bacon|lamb|mutton|meat|veal|turkey|duck|steak|sausage)/i.test(allIngText);
  const hasFish = /(?:fish|salmon|tuna|cod|shrimp|prawn|crab|lobster|anchov|mussel|clam)/i.test(allIngText);
  const hasDairy = /(?:milk|butter|cheese|cream|yogurt|ghee|curd)/i.test(allIngText);
  const hasGluten = /(?:flour|wheat|bread|pasta|spaghetti|noodles|soy sauce|barley|rye)/i.test(allIngText);
  const hasNuts = /(?:peanut|almond|walnut|cashew|pecan|pistachio|hazelnut)/i.test(allIngText);

  if (cat.includes('vegetarian') || (!hasMeat && !hasFish)) {
    tags.push('Vegetarian');
  }
  if (!hasMeat && !hasFish && !hasDairy) {
    tags.push('Vegan');
  }
  if (!hasPork && !hasAlcohol) {
    tags.push('Halal');
  }
  if (!hasGluten) {
    tags.push('Gluten-Free');
  }
  if (!hasDairy) {
    tags.push('Dairy-Free');
  }
  if (!hasNuts) {
    tags.push('Nut-Free');
  }

  return tags;
}

// Convert TheMealDB raw meal object into standard RecipEase recipe format
export function transformMealDbRecipe(meal) {
  if (!meal) return null;

  // Extract ingredients (1 to 20)
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const rawName = meal[`strIngredient${i}`];
    const rawMeasure = meal[`strMeasure${i}`];
    if (rawName && rawName.trim().length > 0) {
      const name = rawName.trim();
      const { amount, unit } = parseMeasurement(rawMeasure);
      const substitute = getSmartSubstitute(name);
      ingredients.push({
        name,
        amount,
        unit,
        substitute,
      });
    }
  }

  const steps = parseSteps(meal.strInstructions);
  const dietary = inferDietaryTags(meal.strCategory, ingredients);
  const baseCalories = estimateCalories(meal.strCategory, ingredients.length);

  // Time estimations based on steps
  const prepTimeMin = Math.max(10, Math.min(30, steps.length * 3));
  const cookTimeMin = Math.max(15, Math.min(45, steps.length * 5));
  const totalTimeMin = prepTimeMin + cookTimeMin;

  const firstSentence = (meal.strInstructions || '').split('.')[0];
  const description =
    firstSentence && firstSentence.length > 20
      ? `${firstSentence.trim()}.`
      : `Delicious authentic ${meal.strArea || ''} ${meal.strCategory || 'dish'} crafted with fresh ingredients.`;

  return {
    id: `mealdb-${meal.idMeal}`,
    apiId: meal.idMeal,
    title: meal.strMeal,
    category: meal.strCategory || 'Main Dish',
    cuisine: meal.strArea || 'International',
    dietary,
    prepTime: `${prepTimeMin} min`,
    cookTime: `${cookTimeMin} min`,
    totalTime: `${totalTimeMin} min`,
    baseServings: 4,
    baseCalories,
    image: meal.strMealThumb || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    description,
    source: 'TheMealDB API',
    sourceUrl: meal.strSource || meal.strYoutube || 'https://www.themealdb.com',
    isApiRecipe: true,
    ingredients,
    steps,
  };
}

// Search recipes on TheMealDB by keyword or recipe title
export async function searchMealsFromApi(query) {
  try {
    const trimmed = (query || '').trim();
    const url = `${THEMEALDB_BASE_URL}/search.php?s=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API response error status: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !data.meals) {
      return [];
    }
    return data.meals.map(transformMealDbRecipe).filter(Boolean);
  } catch (error) {
    console.warn('TheMealDB Search API notice:', error.message);
    return [];
  }
}

// Fetch a single random recipe from TheMealDB
export async function fetchRandomMealFromApi() {
  try {
    const url = `${THEMEALDB_BASE_URL}/random.php`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API response error status: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !data.meals || data.meals.length === 0) {
      return null;
    }
    return transformMealDbRecipe(data.meals[0]);
  } catch (error) {
    console.warn('TheMealDB Random API notice:', error.message);
    return null;
  }
}

// Fetch a batch of diverse curated recipes across categories (Pasta, Seafood, Chicken, Vegetarian, Dessert)
export async function fetchPopularMealsFromApi() {
  const curatedKeywords = ['pasta', 'curry', 'salmon', 'tacos', 'salad', 'soup'];
  try {
    const promises = curatedKeywords.map((kw) =>
      fetch(`${THEMEALDB_BASE_URL}/search.php?s=${encodeURIComponent(kw)}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    );

    const results = await Promise.all(promises);
    const combinedMeals = [];
    const seenIds = new Set();

    for (const res of results) {
      if (res && res.meals && Array.isArray(res.meals)) {
        // Take first 1-2 from each category
        const slice = res.meals.slice(0, 2);
        for (const m of slice) {
          if (!seenIds.has(m.idMeal)) {
            seenIds.add(m.idMeal);
            const transformed = transformMealDbRecipe(m);
            if (transformed) combinedMeals.push(transformed);
          }
        }
      }
    }

    return combinedMeals;
  } catch (error) {
    console.warn('TheMealDB Popular API notice:', error.message);
    return [];
  }
}
