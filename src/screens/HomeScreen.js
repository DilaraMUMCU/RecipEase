import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRecipes } from '../context/RecipeContext';
import BottomTabBar from '../components/BottomTabBar';

const CATEGORIES = ['All', 'Turkish', 'Asian', 'Main Dish', 'Dessert', 'Vegetarian'];

// Turkish-to-English search dictionary for bilingual seamless search
const SEARCH_SYNONYMS = {
  tavuk: 'chicken',
  et: 'beef',
  kiyma: 'ground beef',
  kıyma: 'ground beef',
  makarna: 'noodles',
  eriste: 'noodles',
  erişte: 'noodles',
  tatli: 'dessert',
  tatlı: 'dessert',
  sogan: 'onion',
  soğan: 'onion',
  sarimsak: 'garlic',
  sarımsak: 'garlic',
  patlican: 'eggplant',
  patlıcan: 'eggplant',
  kabak: 'zucchini',
  domates: 'tomatoes',
  un: 'flour',
  seker: 'sugar',
  şeker: 'sugar',
  ceviz: 'walnuts',
  peynir: 'cheese',
  sut: 'milk',
  süt: 'milk',
  yumurta: 'eggs',
  yag: 'oil',
  yağ: 'oil',
  tereyag: 'butter',
  tereyağ: 'butter',
  borek: 'pastry',
  börek: 'pastry',
};

const CATEGORIES = ['All', 'Turkish', 'Asian', 'Main Dish', 'Dessert', 'Vegetarian'];

export default function HomeScreen({ navigation }) {
  const {
    recipes,
    isFavorite,
    toggleFavorite,
    userProfile,
    dietaryPreferences,
    isApiLoading,
    apiStatusMessage,
    searchApiRecipes,
    fetchRandomRecipe,
    fetchPopularApiRecipes,
  } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter recipes dynamically based on search query (bilingual support) and category
  const filteredRecipes = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery && selectedCategory === 'All') return recipes;

    // Check if the query has a known Turkish synonym
    const mappedQuery = SEARCH_SYNONYMS[rawQuery] || rawQuery;

    return recipes.filter((recipe) => {
      // 1. Search Query Matching
      let matchesSearch = true;
      if (rawQuery.length > 0) {
        const titleMatch =
          recipe.title.toLowerCase().includes(rawQuery) ||
          recipe.title.toLowerCase().includes(mappedQuery);

        const cuisineMatch =
          recipe.cuisine.toLowerCase().includes(rawQuery) ||
          recipe.cuisine.toLowerCase().includes(mappedQuery);

        const descMatch =
          recipe.description.toLowerCase().includes(rawQuery) ||
          recipe.description.toLowerCase().includes(mappedQuery);

        const categoryMatch =
          recipe.category.toLowerCase().includes(rawQuery) ||
          recipe.category.toLowerCase().includes(mappedQuery);

        const ingredientMatch = (recipe.ingredients || []).some((ing) => {
          const ingName = ing.name.toLowerCase();
          return (
            ingName.includes(rawQuery) ||
            ingName.includes(mappedQuery) ||
            rawQuery.includes(ingName)
          );
        });

        matchesSearch =
          titleMatch || cuisineMatch || descMatch || categoryMatch || ingredientMatch;
      }

      // 2. Category Matching
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        matchesCategory =
          recipe.category.toLowerCase() === selectedCategory.toLowerCase() ||
          recipe.cuisine.toLowerCase() === selectedCategory.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchQuery, selectedCategory]);

  const initials = useMemo(() => {
    if (!userProfile?.name) return 'DM';
    const parts = userProfile.name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 2);
  }, [userProfile]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const renderRecipeCard = ({ item }) => {
    const favorited = isFavorite(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          <View style={styles.badgeCuisine}>
            <Text style={styles.badgeCuisineText}>{item.cuisine}</Text>
          </View>

          {item.isApiRecipe && (
            <View style={styles.badgeApi}>
              <Text style={styles.badgeApiText}>🌐 Live API</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.cardHeartBtn}
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cardHeartIcon}>{favorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <Text style={styles.recipeDesc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{item.totalTime || item.cookTime || '40 min'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🔥</Text>
              <Text style={styles.metaText}>{item.baseCalories} kcal</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👤</Text>
              <Text style={styles.metaText}>{item.baseServings} portions</Text>
            </View>
          </View>

          {item.dietary && item.dietary.length > 0 && (
            <View style={styles.cardDietaryRow}>
              {item.dietary.map((d, i) => {
                const isPrefActive = dietaryPreferences?.includes(d);
                return (
                  <View
                    key={i}
                    style={[
                      styles.cardDietaryBadge,
                      isPrefActive && styles.cardDietaryBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardDietaryBadgeText,
                        isPrefActive && styles.cardDietaryBadgeTextActive,
                      ]}
                    >
                      {d === 'Vegetarian'
                        ? '🥗 Veg'
                        : d === 'Gluten-Free'
                        ? '🌾 Gluten-Free'
                        : d === 'Dairy-Free'
                        ? '🥛 Dairy-Free'
                        : d === 'Halal'
                        ? '🌙 Halal'
                        : d}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ============================================================== */}
        {/* FIXED HEADER: Brand & Search Bar (Never remounts, smooth typing) */}
        {/* ============================================================== */}
        <View style={styles.stickyHeader}>
          {/* Brand Row */}
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.greeting}>Welcome to</Text>
              <Text style={styles.brandTitle}>RecipEase ✨</Text>
            </View>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Search Bar */}
          <View style={[styles.searchBarContainer, searchQuery.length > 0 && styles.searchBarActive]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes, ingredients..."
              placeholderTextColor="#9E988F"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View style={styles.clearBadge}>
                  <Text style={styles.clearSearch}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Active Search Filter Badge & Quick Online API Search */}
          {searchQuery.trim().length > 0 && (
            <View style={styles.activeFilterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeFilterText}>
                  Results for: <Text style={styles.activeFilterQuery}>"{searchQuery}"</Text> ({filteredRecipes.length} found)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.apiInlineSearchBtn}
                onPress={() =>
                  searchApiRecipes(
                    SEARCH_SYNONYMS[searchQuery.trim().toLowerCase()] || searchQuery
                  )
                }
                disabled={isApiLoading}
                activeOpacity={0.7}
              >
                {isApiLoading ? (
                  <ActivityIndicator size="small" color="#E07A5F" />
                ) : (
                  <Text style={styles.apiInlineSearchBtnText}>🌐 Search API</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearSearch} style={{ marginLeft: 8 }}>
                <Text style={styles.resetFilterText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ============================================================== */}
        {/* SCROLLABLE CONTENT: Banners, Categories & Recipe Cards        */}
        {/* ============================================================== */}
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeCard}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.listHeaderContainer}>
              {/* AI Camera Feature Banner */}
              <TouchableOpacity
                style={styles.scanBanner}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.85}
              >
                <View style={styles.scanIconBox}>
                  <Text style={styles.cameraIcon}>📸</Text>
                </View>
                <View style={styles.scanTextBox}>
                  <Text style={styles.scanTitle}>AI Vision Pantry Scanner</Text>
                  <Text style={styles.scanSubtitle}>
                    Snap a photo of ingredients to get instant zero-waste recipes
                  </Text>
                </View>
                <Text style={styles.scanArrow}>›</Text>
              </TouchableOpacity>

              {/* Online Cloud API Recipe Integration Banner (TheMealDB) */}
              <View style={styles.apiBanner}>
                <View style={styles.apiBannerHeader}>
                  <View style={styles.apiBannerIconBox}>
                    <Text style={{ fontSize: 20 }}>🌐</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.apiBannerTitle}>TheMealDB Recipe API</Text>
                      <View style={styles.apiLiveBadge}>
                        <Text style={styles.apiLiveBadgeText}>LIVE CLOUD</Text>
                      </View>
                    </View>
                    <Text style={styles.apiBannerSubtitle}>
                      Fetch authentic recipes from global culinary database
                    </Text>
                  </View>
                  {isApiLoading && <ActivityIndicator size="small" color="#E07A5F" />}
                </View>

                {apiStatusMessage ? (
                  <View style={styles.apiStatusBox}>
                    <Text style={styles.apiStatusText}>{apiStatusMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.apiActionRow}>
                  <TouchableOpacity
                    style={styles.apiActionButton}
                    onPress={() => fetchPopularApiRecipes()}
                    disabled={isApiLoading}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.apiActionButtonText}>🌍 Load Online Recipes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.apiActionButton, styles.apiActionSecondary]}
                    onPress={() => fetchRandomRecipe()}
                    disabled={isApiLoading}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.apiActionButtonText, styles.apiActionSecondaryText]}>
                      🎲 Surprise Recipe
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Category Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryPill,
                        isSelected && styles.categoryPillActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Section Subtitle */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionHeaderTitle}>Curated Recipes</Text>
                <Text style={styles.resultsCount}>
                  {filteredRecipes.length} available
                </Text>
              </View>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No Local Recipes Found</Text>
              <Text style={styles.emptySubtitle}>
                No local recipes matched "{searchQuery}". Search TheMealDB cloud database to find authentic global dishes!
              </Text>
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.emptyApiBtn}
                  onPress={() =>
                    searchApiRecipes(
                      SEARCH_SYNONYMS[searchQuery.trim().toLowerCase()] || searchQuery
                    )
                  }
                  disabled={isApiLoading}
                  activeOpacity={0.8}
                >
                  {isApiLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.emptyApiBtnText}>
                      🌐 Search "{searchQuery}" on TheMealDB API
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.clearSearchBtn} onPress={handleClearSearch}>
                <Text style={styles.clearSearchBtnText}>Reset Search Filter</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <BottomTabBar
          activeTab="Home"
          onTabPress={(tabKey) => {
            if (tabKey === 'Favorites') navigation.navigate('Favorites');
            else if (tabKey === 'Scan') navigation.navigate('Scan');
            else if (tabKey === 'Profile') navigation.navigate('Profile');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  stickyHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#FAF7F2',
  },
  list: {
    paddingBottom: 20,
  },
  listHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  greeting: {
    fontSize: 13,
    color: '#8A857D',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E3832',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#ECE6DC',
  },
  searchBarActive: {
    borderColor: '#E07A5F',
    backgroundColor: '#FFFCFA',
  },
  searchIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2B2B2B',
    paddingVertical: 8,
  },
  clearBadge: {
    backgroundColor: '#EFEAE2',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearch: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  activeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#554D44',
  },
  activeFilterQuery: {
    fontWeight: '700',
    color: '#E07A5F',
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E07A5F',
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE4D8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DFD7C8',
  },
  scanIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cameraIcon: {
    fontSize: 22,
  },
  scanTextBox: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 2,
  },
  scanSubtitle: {
    fontSize: 11,
    color: '#666057',
    lineHeight: 15,
  },
  scanArrow: {
    fontSize: 22,
    fontWeight: '300',
    color: '#554E45',
    marginLeft: 8,
  },
  categoryScroll: {
    paddingBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  categoryPillActive: {
    backgroundColor: '#2B2B2B',
    borderColor: '#2B2B2B',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E665E',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A857D',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  badgeCuisine: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCuisineText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeartIcon: {
    fontSize: 16,
  },
  cardInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  recipeDesc: {
    fontSize: 13,
    color: '#6E665E',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2EDE4',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#8A857D',
    fontWeight: '600',
  },
  cardDietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  cardDietaryBadge: {
    backgroundColor: '#F7F4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  cardDietaryBadgeActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  cardDietaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A7268',
  },
  cardDietaryBadgeTextActive: {
    color: '#2E7D32',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A857D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  clearSearchBtn: {
    backgroundColor: '#E07A5F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearSearchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Online API Live Badges & Banner Styles */
  badgeApi: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(42, 157, 143, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeApiText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  apiInlineSearchBtn: {
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#E07A5F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiInlineSearchBtnText: {
    color: '#E07A5F',
    fontSize: 11,
    fontWeight: '700',
  },
  apiBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    elevation: 2,
    shadowColor: '#2A9D8F',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  apiBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  apiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  apiLiveBadge: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  apiLiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  apiBannerSubtitle: {
    fontSize: 11,
    color: '#7A7369',
    marginTop: 2,
  },
  apiStatusBox: {
    backgroundColor: '#F0F9F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4EFEA',
  },
  apiStatusText: {
    fontSize: 11,
    color: '#2A9D8F',
    fontWeight: '600',
  },
  apiActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  apiActionButton: {
    flex: 1,
    backgroundColor: '#2A9D8F',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  apiActionSecondary: {
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#E07A5F',
  },
  apiActionSecondaryText: {
    color: '#E07A5F',
  },
  emptyApiBtn: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  emptyApiBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
