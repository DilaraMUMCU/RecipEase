import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const baseServings = recipe.baseServings || 4;
  const [servings, setServings] = useState(baseServings);
  const [substituted, setSubstituted] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  // Helper to dynamically calculate and format scaled ingredient amounts
  const formatScaledAmount = (baseAmount) => {
    if (baseAmount === null || baseAmount === undefined) return '';
    const ratio = servings / baseServings;
    const scaled = baseAmount * ratio;

    if (Number.isInteger(scaled)) {
      return scaled.toString();
    }

    const rounded = Math.round(scaled * 100) / 100;
    const whole = Math.floor(rounded);
    const fraction = rounded - whole;

    let fracStr = '';
    if (Math.abs(fraction - 0.25) < 0.03) fracStr = '1/4';
    else if (Math.abs(fraction - 0.33) < 0.04) fracStr = '1/3';
    else if (Math.abs(fraction - 0.5) < 0.03) fracStr = '1/2';
    else if (Math.abs(fraction - 0.66) < 0.04) fracStr = '2/3';
    else if (Math.abs(fraction - 0.75) < 0.03) fracStr = '3/4';

    if (fracStr) {
      return whole > 0 ? `${whole} ${fracStr}` : fracStr;
    }

    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1).replace(/\.0$/, '');
  };

  // Dynamically calculate calories based on servings
  const currentCalories = Math.round((recipe.baseCalories * servings) / baseServings);

  // Smart substitution dialog
  const handleSubstitute = (idx, ing) => {
    const isCurrentlySubbed = substituted[idx];

    if (isCurrentlySubbed) {
      Alert.alert(
        'Revert Substitution',
        `Switch back to original "${ing.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revert',
            onPress: () => {
              setSubstituted((prev) => {
                const updated = { ...prev };
                delete updated[idx];
                return updated;
              });
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Smart Substitution Engine 🔄',
      `Missing "${ing.name}" in your pantry?\n\n✨ Recommended Alternative:\n${ing.substitute || 'A suitable pantry staple'}\n\nWould you like to apply this substitution?`,
      [
        { text: 'Keep Original', style: 'cancel' },
        {
          text: 'Apply Alternative',
          onPress: () => {
            setSubstituted((prev) => ({ ...prev, [idx]: true }));
            Alert.alert(
              'Recipe Updated! ✅',
              `"${ing.name}" has been replaced with "${ing.substitute}" in your recipe.`
            );
          },
        },
      ]
    );
  };

  // Toggle step completion for interactive cooking mode
  const toggleStep = (idx) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this delicious ${recipe.title} on RecipEase! Servings: ${servings}.`,
      });
    } catch (error) {
      // ignore
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.image} />
        <View style={styles.cuisineBadge}>
          <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Title & Metadata */}
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{recipe.totalTime || recipe.time}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaIcon}>🔥</Text>
            <Text style={styles.metaText}>{currentCalories} kcal</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaIcon}>🏷️</Text>
            <Text style={styles.metaText}>{recipe.category || 'Recipe'}</Text>
          </View>
        </View>

        {/* Dynamic Portion Scaling Card */}
        <View style={styles.scalingCard}>
          <View>
            <Text style={styles.scalingTitle}>Servings & Portions</Text>
            <Text style={styles.scalingSubtitle}>
              Ingredients auto-scale proportionally
            </Text>
          </View>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setServings((prev) => Math.max(1, prev - 1))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.servingNumberBox}>
              <Text style={styles.servingNumber}>{servings}</Text>
              <Text style={styles.servingLabel}>
                {servings === 1 ? 'person' : 'people'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setServings((prev) => prev + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.sectionCounter}>
            {recipe.ingredients.length} items
          </Text>
        </View>

        <View style={styles.ingredientsBox}>
          {recipe.ingredients.map((ing, idx) => {
            const isSubbed = substituted[idx];
            const displayAmount = formatScaledAmount(ing.amount);

            return (
              <View
                key={idx}
                style={[
                  styles.ingredientRow,
                  isSubbed && styles.ingredientRowSubbed,
                ]}
              >
                <View style={styles.ingredientLeft}>
                  <View style={styles.bulletDot} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.ingredientName,
                        isSubbed && styles.ingredientNameSubbed,
                      ]}
                    >
                      {isSubbed ? ing.substitute : ing.name}
                    </Text>
                    {isSubbed && (
                      <Text style={styles.subbedNotice}>
                        (Substituted for {ing.name})
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.ingredientRight}>
                  {displayAmount ? (
                    <Text style={styles.amountBadge}>
                      {displayAmount} {ing.unit}
                    </Text>
                  ) : (
                    <Text style={styles.amountBadge}>{ing.unit}</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.substituteButton,
                      isSubbed && styles.substituteButtonActive,
                    ]}
                    onPress={() => handleSubstitute(idx, ing)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.substituteButtonText,
                        isSubbed && styles.substituteButtonTextActive,
                      ]}
                    >
                      {isSubbed ? 'Revert' : 'Swap'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Step-by-Step Instructions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Preparation Steps</Text>
          <Text style={styles.sectionCounter}>
            {recipe.steps.length} steps
          </Text>
        </View>

        <View style={styles.stepsBox}>
          {recipe.steps.map((step, idx) => {
            const isDone = completedSteps[idx];
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.stepCard, isDone && styles.stepCardDone]}
                onPress={() => toggleStep(idx)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.stepNumberBadge, isDone && styles.stepNumberBadgeDone]}
                >
                  <Text
                    style={[styles.stepNumberText, isDone && styles.stepNumberTextDone]}
                  >
                    {isDone ? '✓' : idx + 1}
                  </Text>
                </View>

                <View style={styles.stepContent}>
                  <Text
                    style={[styles.stepText, isDone && styles.stepTextDone]}
                  >
                    {step}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Source citation according to project guidelines */}
        {recipe.source && (
          <View style={styles.sourceFooter}>
            <Text style={styles.sourceText}>
              Original source: <Text style={{ fontWeight: 'bold' }}>{recipe.source}</Text>
            </Text>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.shareBtnText}>Share Recipe 🔗</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 270,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cuisineBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cuisineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    padding: 20,
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE8E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metaIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  scalingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  scalingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  scalingSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 12,
    padding: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  servingNumberBox: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  servingNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  servingLabel: {
    fontSize: 10,
    color: '#777',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  sectionCounter: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
  },
  ingredientRowSubbed: {
    backgroundColor: '#F9FBF6',
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 10,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  ingredientNameSubbed: {
    color: '#15803D',
  },
  subbedNotice: {
    fontSize: 11,
    color: '#65A30D',
    fontStyle: 'italic',
    marginTop: 2,
  },
  ingredientRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  substituteButton: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4D0C8',
    backgroundColor: '#FAF8F5',
  },
  substituteButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  substituteButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  substituteButtonTextActive: {
    color: '#166534',
  },
  stepsBox: {
    marginBottom: 20,
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  stepCardDone: {
    backgroundColor: '#F4FBF7',
    borderColor: '#BBF7D0',
    opacity: 0.8,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberBadgeDone: {
    backgroundColor: '#22C55E',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
  },
  stepNumberTextDone: {
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#3B3B3B',
  },
  stepTextDone: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  sourceFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
  },
  actionRow: {
    marginVertical: 12,
    marginBottom: 40,
  },
  shareBtn: {
    backgroundColor: '#333333',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
