import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRecipes } from '../context/RecipeContext';
import BottomTabBar from '../components/BottomTabBar';

export default function FavoritesScreen({ navigation }) {
  const { favoriteRecipes, toggleFavorite } = useRecipes();

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.heartIcon}>❤️</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.recipeDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>⏱️ {item.totalTime || item.time}</Text>
          <Text style={styles.metaText}>🔥 {item.baseCalories} kcal</Text>
          <Text style={styles.metaText}>🌍 {item.cuisine}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Recipes ❤️</Text>
          <Text style={styles.headerSubtitle}>
            {favoriteRecipes.length} {favoriteRecipes.length === 1 ? 'recipe' : 'recipes'} in your collection
          </Text>
        </View>

        {favoriteRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>No Saved Recipes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on any recipe to add it to your personal favorites.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreBtnText}>Browse Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={favoriteRecipes}
            keyExtractor={(item) => item.id}
            renderItem={renderRecipeItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <BottomTabBar
          activeTab="Favorites"
          onTabPress={(tab) => {
            if (tab === 'Home') navigation.navigate('Home');
            else if (tab === 'Scan') navigation.navigate('Scan');
            else if (tab === 'Profile') navigation.navigate('Profile');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F2' },
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8A857D',
    marginTop: 2,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE7DC',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardInfo: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2B2B',
    flex: 1,
    marginRight: 10,
  },
  heartBtn: {
    padding: 4,
  },
  heartIcon: {
    fontSize: 18,
  },
  recipeDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F0E8',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#3E3832',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
