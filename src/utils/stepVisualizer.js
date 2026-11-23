// Step-by-Step Culinary Stage Visualizer & Pro-Chef Tips
// Maps recipe steps to visual illustrations, stage badges, and thematic imagery

const STAGE_KEYWORDS = [
  {
    regex: /(?:mix|blend|whisk|beat|yolk|egg|sugar|flour|combine|stir|bowl|bain-marie)/i,
    stage: 'Prep & Whisking',
    icon: '🥣',
    image: 'https://images.unsplash.com/photo-1556911073-38141963c9e0?w=800&q=80',
    tip: 'Ensure mixing bowls and whisks are dry and room temperature for best consistency.',
  },
  {
    regex: /(?:knead|dough|roll|rolling pin|sheet|phyllo|filo|ball|balls|stretch)/i,
    stage: 'Kneading & Rolling Dough',
    icon: '🍞',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    tip: 'Dust surface lightly with starch or flour so the dough does not stick or tear.',
  },
  {
    regex: /(?:chop|slice|cut|julienne|dice|shred|knife|strips)/i,
    stage: 'Chopping & Slicing',
    icon: '🔪',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
    tip: 'Use a steady cutting board and keep slices uniform for even cooking.',
  },
  {
    regex: /(?:boil|blanch|simmer|pot|noodles|water|pasta|drain)/i,
    stage: 'Boiling & Blanching',
    icon: '🍲',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    tip: 'Use generously salted boiling water to season noodles or vegetables from the inside out.',
  },
  {
    regex: /(?:fry|sauté|saute|skillet|pan|sear|wok|brown|oil|butter|meat|beef|chicken)/i,
    stage: 'Sautéing & Searing',
    icon: '🍳',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    tip: 'Keep the pan hot and avoid overcrowding so ingredients sear instead of steaming.',
  },
  {
    regex: /(?:bake|oven|tray|golden|preheat|roast|180°C|350°F)/i,
    stage: 'Oven Baking & Roasting',
    icon: '♨️',
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&q=80',
    tip: 'Rotate your baking tray halfway through for an even, golden-brown crust.',
  },
  {
    regex: /(?:syrup|sugar and water|pour|glaze|drench|soak)/i,
    stage: 'Syrup Infusion & Glazing',
    icon: '🍯',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80',
    tip: 'Pour hot syrup over cooled pastry (or cool syrup over hot pastry) to keep it crispy.',
  },
  {
    regex: /(?:chill|refrigerate|cool|rest|hours|firm)/i,
    stage: 'Chilling & Setting',
    icon: '⏳',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80',
    tip: 'Patience is key: chilling allows delicate dessert layers and spices to set firmly.',
  },
  {
    regex: /(?:garnish|serve|plate|cocoa|sesame|warm|enjoy|dish)/i,
    stage: 'Plating & Garnishing',
    icon: '🍽️',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    tip: 'Garnish just before serving for the freshest aroma and vibrant presentation.',
  },
];

// Curated authentic visuals for each recipe's signature steps
const RECIPE_CUSTOM_STEP_IMAGES = {
  // Baklava
  '1': [
    'https://images.unsplash.com/photo-1556911073-38141963c9e0?w=800&q=80', // mixing ingredients
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', // knead dough
    'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&q=80', // walnuts
    'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&q=80', // dough balls
    'https://images.unsplash.com/photo-1621236378699-8597fee6a1ce?w=800&q=80', // rolling thin sheet
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&q=80', // layering pastry
    'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&q=80', // walnut layers
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', // diamond slicing
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80', // pouring melted butter
    'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&q=80', // golden baking
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsxsMywIXLHxWa6YVbjD7-BXPSyk_NRqZqGvVHP4D79g&s=10', // syrup infusion
  ],
  // Japchae
  '2': [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', // sliced beef
    'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80', // blanch spinach
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80', // boiling glass noodles
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80', // stir frying onions
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', // stir frying carrots & beef
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', // adding sauce
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80', // tossing noodles
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMB1i-jCiWr_9vmoHE6AaU-_fO8pMkzhTuOhFIORtK6g&s=10', // plated japchae
  ],
  // Tiramisu
  '3': [
    'https://images.unsplash.com/photo-1556911073-38141963c9e0?w=800&q=80', // whisk egg yolks
    'https://images.unsplash.com/photo-1587248720327-8eb72564be1e?w=800&q=80', // cooling zabaglione
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80', // folding mascarpone
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80', // whipping heavy cream
    'https://images.unsplash.com/photo-1587248720327-8eb72564be1e?w=800&q=80', // folding whipped cream
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80', // espresso coffee
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', // dipping ladyfingers
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80', // spreading cream
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', // second layer
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80', // chilling in fridge
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2P2IxWaJczIOjIM8NZqu18NW_8TalgcZK2mprzMA2Wg&s=10', // cocoa dusting
  ],
};

export function getStepVisual(recipeId, stepIndex, stepText = '') {
  // 1. Check custom recipe images
  const recipeImages = RECIPE_CUSTOM_STEP_IMAGES[recipeId];
  const customImg = recipeImages && recipeImages[stepIndex] ? recipeImages[stepIndex] : null;

  // 2. Keyword detection for stage, icon, and tip
  for (const item of STAGE_KEYWORDS) {
    if (item.regex.test(stepText)) {
      return {
        stage: item.stage,
        icon: item.icon,
        image: customImg || item.image,
        tip: item.tip,
      };
    }
  }

  // Fallback defaults
  return {
    stage: `Preparation Step ${stepIndex + 1}`,
    icon: '👨‍🍳',
    image: customImg || 'https://images.unsplash.com/photo-1556911073-38141963c9e0?w=800&q=80',
    tip: 'Follow the recipe timing carefully and keep ingredients organized.',
  };
}
