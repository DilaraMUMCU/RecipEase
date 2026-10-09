import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function RecipeDetailScreen({ route }) {
  const { recipe } = route.params;
  const [servings, setServings] = useState(1);

  const handleSubstitute = (ingredientName) => {
    Alert.alert(
      "Smart Substitution",
      `Would you like to replace ${ingredientName} with a suitable alternative?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => Alert.alert("Replaced!", `We updated the recipe based on your available ingredients.`) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: recipe.image }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>{recipe.time} • {recipe.calories}</Text>
        
        <View style={styles.servingsControl}>
          <Text style={styles.sectionTitle}>Servings: {servings}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btn} onPress={() => setServings(Math.max(1, servings - 1))}>
              <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => setServings(servings + 1)}>
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ing, idx) => (
          <View key={idx} style={styles.ingredientRow}>
            <Text style={styles.ingredientText}>• {ing.name}</Text>
            <TouchableOpacity onPress={() => handleSubstitute(ing.name)}>
              <Text style={styles.substituteBtn}>Substitute</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Steps</Text>
        {recipe.steps.map((step, idx) => (
          <Text key={idx} style={styles.stepText}>{idx + 1}. {step}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffcf7' },
  image: { width: '100%', height: 250 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  meta: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 16 },
  servingsControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 10 },
  btn: { backgroundColor: '#e2d9c8', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 5 },
  btnText: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#444' },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' },
  ingredientText: { fontSize: 16, color: '#333' },
  substituteBtn: { color: '#007aff', fontSize: 14, fontWeight: '500' },
  stepText: { fontSize: 16, color: '#444', marginBottom: 10, lineHeight: 22 },
});
