/**
 * Food Image Utility for MealBridge AI
 * Provides accurate, high-definition food photograph references
 * ensuring every food item visually matches its exact name and type.
 */

export const FOOD_IMAGES = {
  rice: '/images/rice.jpg',
  biryani: '/images/biryani.jpg',
  chapati: '/images/chapati.jpg',
  roti: '/images/chapati.jpg',
  dal: '/images/dal.jpg',
  curry: '/images/curry.jpg',
  idli: '/images/idli.jpg',
  dosa: '/images/dosa.jpg',
  fruits: '/images/fruits.jpg',
  bread: '/images/bread.jpg',
  bakery: '/images/bread.jpg',
  meals: '/images/meals.jpg',
  vegetables: '/images/vegetables.jpg',
  default: '/images/food-default.jpg',
};

/**
 * Resolves the accurate food image URL for a given food name, type, or object.
 * Strictly prioritizes food identity so that "Rice" always shows steamed white rice,
 * "Biryani" shows spiced biryani, "Dal" shows dal, etc.
 *
 * @param {string|object} food - Food name string or food object
 * @param {string} [category] - Optional category string
 * @returns {string} - Image URL
 */
export function getFoodImage(food, category = '') {
  let name = '';
  let type = '';
  let cat = String(category || '').toLowerCase().trim();
  let explicitUrl = null;

  if (typeof food === 'string') {
    name = food.toLowerCase().trim();
  } else if (food && typeof food === 'object') {
    name = String(
      food.name ||
      food.foodName ||
      food.food_name ||
      food.title ||
      ''
    ).toLowerCase().trim();

    type = String(
      food.foodType ||
      food.food_type ||
      food.category ||
      food.type ||
      ''
    ).toLowerCase().trim();

    const rawImg = food.image_url || food.image || food.imageUrl || null;
    if (typeof rawImg === 'string' && rawImg.trim()) {
      explicitUrl = rawImg.trim();
    }
  }

  // Prioritize custom uploaded photo if provided (non-dummy)
  if (
    explicitUrl &&
    !explicitUrl.includes('example.com') &&
    (explicitUrl.startsWith('/api/donations/images/') ||
      explicitUrl.startsWith('/uploads/') ||
      explicitUrl.startsWith('data:image/') ||
      explicitUrl.startsWith('http://') ||
      explicitUrl.startsWith('https://'))
  ) {
    return explicitUrl;
  }

  // 1. Biryani / Pulao (checked before rice so spiced rice dishes get biryani photo)
  if (
    name.includes('biryani') ||
    name.includes('biriyani') ||
    name.includes('pulao') ||
    name.includes('pulav')
  ) {
    return FOOD_IMAGES.biryani;
  }

  // 2. Rice (steamed, cooked, plain white rice, chawal)
  if (
    name.includes('rice') ||
    name.includes('chawal')
  ) {
    return FOOD_IMAGES.rice;
  }

  // 3. Chapati / Roti / Paratha / Naan / Indian Breads
  if (
    name.includes('chapati') ||
    name.includes('chapatis') ||
    name.includes('chapatti') ||
    name.includes('roti') ||
    name.includes('rotis') ||
    name.includes('phulka') ||
    name.includes('fulka') ||
    name.includes('paratha') ||
    name.includes('naan')
  ) {
    return FOOD_IMAGES.chapati;
  }

  // 4. Dal / Lentils / Sambar
  if (
    name.includes('dal') ||
    name.includes('daal') ||
    name.includes('lentil') ||
    name.includes('sambar') ||
    name.includes('rasam') ||
    name.includes('tadka')
  ) {
    return FOOD_IMAGES.dal;
  }

  // 5. Curry / Sabzi / Gravy
  if (
    name.includes('curry') ||
    name.includes('sabzi') ||
    name.includes('sabji') ||
    name.includes('gravy') ||
    name.includes('paneer') ||
    name.includes('korma') ||
    name.includes('kurma') ||
    name.includes('masala')
  ) {
    return FOOD_IMAGES.curry;
  }

  // 6. Idli
  if (
    name.includes('idli') ||
    name.includes('idly')
  ) {
    return FOOD_IMAGES.idli;
  }

  // 7. Dosa
  if (
    name.includes('dosa') ||
    name.includes('dosai')
  ) {
    return FOOD_IMAGES.dosa;
  }

  // 8. Bread / Bakery
  if (
    name.includes('bread') ||
    name.includes('loaf') ||
    name.includes('bakery') ||
    name.includes('bun') ||
    name.includes('sandwich') ||
    name.includes('toast')
  ) {
    return FOOD_IMAGES.bread;
  }

  // 9. Fruits
  if (
    name.includes('fruit') ||
    name.includes('fruits') ||
    name.includes('apple') ||
    name.includes('banana') ||
    name.includes('orange') ||
    name.includes('mango')
  ) {
    return FOOD_IMAGES.fruits;
  }

  // 10. Vegetables
  if (
    name.includes('vegetable') ||
    name.includes('vegetables') ||
    name.includes('veggie') ||
    name.includes('veggies') ||
    name.includes('tomato') ||
    name.includes('potato') ||
    name.includes('onion')
  ) {
    return FOOD_IMAGES.vegetables;
  }

  // 11. Meals / Thali
  if (
    name.includes('meal') ||
    name.includes('meals') ||
    name.includes('thali') ||
    name.includes('dinner') ||
    name.includes('lunch')
  ) {
    return FOOD_IMAGES.meals;
  }

  // If name didn't give a specific match, check category & foodType
  const typeText = `${type} ${cat}`.trim();

  if (typeText.includes('biryani') || typeText.includes('pulao')) {
    return FOOD_IMAGES.biryani;
  }
  if (typeText.includes('rice')) {
    return FOOD_IMAGES.rice;
  }
  if (typeText.includes('curry') || typeText.includes('sabzi')) {
    return FOOD_IMAGES.curry;
  }
  if (typeText.includes('dal') || typeText.includes('lentil')) {
    return FOOD_IMAGES.dal;
  }
  if (typeText.includes('roti') || typeText.includes('chapati') || typeText.includes('bread')) {
    return FOOD_IMAGES.chapati;
  }
  if (typeText.includes('fruit')) {
    return FOOD_IMAGES.fruits;
  }
  if (typeText.includes('vegetable')) {
    return FOOD_IMAGES.vegetables;
  }
  if (typeText.includes('meal') || typeText.includes('cooked')) {
    return FOOD_IMAGES.meals;
  }

  // If a valid non-dummy URL was supplied, honor it
  if (
    explicitUrl &&
    !explicitUrl.includes('example.com') &&
    (explicitUrl.startsWith('http://') ||
      explicitUrl.startsWith('https://') ||
      explicitUrl.startsWith('/images/') ||
      explicitUrl.startsWith('data:image/'))
  ) {
    return explicitUrl;
  }

  // Default fallback
  return FOOD_IMAGES.default;
}

export const getFoodCategoryImage = (name, category) => getFoodImage(name, category);

export default getFoodImage;
