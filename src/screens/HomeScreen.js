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
  Alert,
} from 'react-native';
import { RECIPES } from '../data/recipes';

const CATEGORIES = ['All', 'Turkish', 'Asian', 'Main Dish', 'Dessert', 'Vegetarian'];

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter recipes dynamically based on search query and category
  const filteredRecipes = useMemo(() => {
    return RECIPES.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        matchesCategory =
          recipe.category.toLowerCase() === selectedCategory.toLowerCase() ||
          recipe.cuisine.toLowerCase() === selectedCategory.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleScanPress = () => {
    Alert.alert(
      'Smart Ingredient Scanner 📸',
      'Point your camera at ingredients inside your fridge or pantry to automatically identify them and discover matching recipes!\n\n(AI Vision Feature Preview)',
      [
        { text: 'Got it', style: 'default' },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.greeting}>Welcome to</Text>
          <Text style={styles.brandTitle}>RecipEase ✨</Text>
        </View>
        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() =>
            Alert.alert(
              'User Profile',
              'Dilara MUMCU\nSystem Architect & Founder\nRecipEase MVP v1.0'
            )
          }
        >
          <Text style={styles.avatarText}>DM</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes, ingredients, cuisines..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI Camera Feature Banner (As showcased in presentation) */}
      <TouchableOpacity
        style={styles.scanBanner}
        onPress={handleScanPress}
        activeOpacity={0.85}
      >
        <View style={styles.scanIconBox}>
          <Text style={styles.cameraIcon}>📸</Text>
        </View>
        <View style={styles.scanTextBox}>
          <Text style={styles.scanTitle}>Scan Ingredients to Find Recipes</Text>
          <Text style={styles.scanSubtitle}>
            Zero-waste cooking with AI pantry detection
          </Text>
        </View>
        <Text style={styles.scanArrow}>›</Text>
      </TouchableOpacity>

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
  );

  const renderRecipeCard = ({ item }) => (
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
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.recipeDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{item.totalTime || item.time}</Text>
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
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No Recipes Found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for different ingredients or select "All".
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  list: {
    paddingBottom: 30,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    height: 48,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearSearch: {
    fontSize: 16,
    color: '#999',
    padding: 4,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE4D8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
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
    fontWeight: '700',
    color: '#2B2B2B',
  },
  scanSubtitle: {
    fontSize: 11,
    color: '#706A60',
    marginTop: 2,
  },
  scanArrow: {
    fontSize: 24,
    color: '#706A60',
    fontWeight: '300',
    marginLeft: 6,
  },
  categoryScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0D5',
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: '#3E3832',
    borderColor: '#3E3832',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E675D',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  resultsCount: {
    fontSize: 12,
    color: '#8A857D',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE7DC',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 170,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  badgeCuisine: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCuisineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F0E8',
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});
