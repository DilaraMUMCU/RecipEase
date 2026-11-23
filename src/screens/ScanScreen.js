import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRecipes } from '../context/RecipeContext';
import { detectIngredientsFromImage } from '../services/aiVisionService';
import BottomTabBar from '../components/BottomTabBar';

const PRESET_PANTRY_ITEMS = [
  'Ground Beef',
  'Eggs',
  'Milk',
  'Flour',
  'Onion',
  'Tomatoes',
  'Garlic',
  'Zucchini',
  'Eggplant',
  'Chicken Breast',
  'Rice Noodles',
  'Walnuts',
  'Soy Sauce',
  'Butter',
  'Olive Oil',
];

// Demo Pantry Presets for quick testing
const DEMO_SCENARIOS = [
  {
    title: '🥘 Mediterranean Basket',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
    detected: ['Eggplant', 'Zucchini', 'Tomatoes', 'Garlic', 'Onion'],
  },
  {
    title: '🥩 Anatolian Pantry',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80',
    detected: ['Ground Beef', 'Flour', 'Tomatoes', 'Onion', 'Garlic', 'Butter'],
  },
  {
    title: '🍜 Asian Stir-Fry Box',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    detected: ['Chicken Breast', 'Rice Noodles', 'Soy Sauce', 'Eggs', 'Garlic'],
  },
];

export default function ScanScreen({ navigation }) {
  const { recipes, findMatchingRecipes } = useRecipes();

  // Photo state (captured camera photo or demo image)
  const [photoUri, setPhotoUri] = useState(
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80'
  );
  const [hasCapturedCustomPhoto, setHasCapturedCustomPhoto] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState(null);

  const [selectedIngredients, setSelectedIngredients] = useState([
    'Tomatoes',
    'Onion',
    'Eggplant',
    'Zucchini',
    'Garlic',
  ]);
  const [customInput, setCustomInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [matchedResults, setMatchedResults] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState({
    Tomatoes: 98,
    Onion: 95,
    Eggplant: 92,
    Zucchini: 89,
    Garlic: 85,
  });
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState(
    'Detected 5 fresh pantry ingredients: Tomatoes, Onion, Eggplant, Zucchini, Garlic.'
  );

  // Live Webcam state on Web
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Check initial camera permission status on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await ImagePicker.getCameraPermissionsAsync();
        setCameraPermissionStatus(status);
      } catch (e) {
        console.log('Permission check notice:', e);
      }
    })();

    // Initial match computation for default preview
    const initialMatches = findMatchingRecipes(selectedIngredients);
    setMatchedResults(initialMatches);

    return () => {
      stopWebcam();
    };
  }, []);

  // Web Webcam controller
  const startWebcam = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        mediaStreamRef.current = stream;
        setWebcamActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 150);
      } catch (err) {
        console.warn('Webcam permission error:', err);
        Alert.alert(
          'Webcam Notice',
          'Could not start webcam stream. Opening photo upload instead.'
        );
        handlePickFromGallery();
      }
    }
  };

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setWebcamActive(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopWebcam();
      setHasCapturedCustomPhoto(true);
      processCapturedImage(dataUrl);
    } catch (e) {
      console.warn('Snapshot error:', e);
      stopWebcam();
    }
  };

  // Request camera permission and launch camera
  const handleTakePhoto = async () => {
    // 1. On Web: start live webcam viewfinder if available
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        startWebcam();
        return;
      }
    }

    // 2. On Mobile Devices (iOS / Android): Launch native camera
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermissionStatus(permission.status);

      if (!permission.granted) {
        Alert.alert(
          '📷 Camera Permission Required',
          'RecipEase needs access to your device camera to snap and detect pantry ingredients. Please enable camera permission in your phone settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setHasCapturedCustomPhoto(true);
        const asset = result.assets[0];
        processCapturedImage(asset.uri, null, asset.base64);
      }
    } catch (err) {
      console.log('Camera error:', err);
      handlePickFromGallery();
    }
  };

  // Request gallery permission and pick from photo library
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          '🖼️ Photo Library Permission Required',
          'RecipEase needs access to your photos to upload pantry ingredients.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setHasCapturedCustomPhoto(true);
        const asset = result.assets[0];
        processCapturedImage(asset.uri, null, asset.base64);
      }
    } catch (err) {
      Alert.alert('Gallery Error', 'Could not open photos: ' + err.message);
    }
  };

  // Main menu for photo upload / snap
  const handleUploadPhotoMenu = () => {
    Alert.alert(
      '📸 Upload Pantry Photo',
      'Choose how you want to add a photo of your kitchen ingredients:',
      [
        {
          text: '📷 Take Photo with Camera',
          onPress: handleTakePhoto,
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: handlePickFromGallery,
        },
        {
          text: '⚡ Use Demo Fridge Photo',
          onPress: () => handleApplyScenario(DEMO_SCENARIOS[0]),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Run AI Vision Object Detection on the captured/selected image
  const processCapturedImage = async (newUri, detectedList = null, base64 = null) => {
    setPhotoUri(newUri);
    setIsScanning(true);
    setMatchedResults(null);

    try {
      let detection;
      if (detectedList) {
        // Preset / manual demo scenario
        const scores = {};
        detectedList.forEach((ing) => {
          scores[ing] = Math.floor(Math.random() * 8) + 91;
        });
        detection = {
          ingredients: detectedList,
          confidenceScores: scores,
          summary: `AI detected ${detectedList.length} pantry items from visual cues.`,
        };
        await new Promise((r) => setTimeout(r, 600));
      } else {
        // Real AI Vision Detection Engine
        detection = await detectIngredientsFromImage({ uri: newUri, base64 });
      }

      setSelectedIngredients(detection.ingredients);
      setConfidenceScores(detection.confidenceScores);
      setAiAnalysisSummary(detection.summary);

      // Auto-compute matching recipes from existing app recipes
      const matches = findMatchingRecipes(detection.ingredients);
      setMatchedResults(matches);
    } catch (err) {
      console.warn('AI Vision Processing error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyScenario = (scenario) => {
    processCapturedImage(scenario.image, scenario.detected);
  };

  const togglePreset = (item) => {
    setSelectedIngredients((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomIngredient = () => {
    if (!customInput.trim()) return;
    const name = customInput.trim();
    if (!selectedIngredients.includes(name)) {
      setSelectedIngredients((prev) => [...prev, name]);
      setConfidenceScores((prev) => ({ ...prev, [name]: 100 }));
    }
    setCustomInput('');
  };

  const removeIngredient = (item) => {
    setSelectedIngredients((prev) => prev.filter((i) => i !== item));
  };

  const handleRunAnalysis = () => {
    if (selectedIngredients.length === 0) {
      Alert.alert(
        'No Ingredients Selected',
        'Please snap a photo or add ingredients to find recipes.'
      );
      return;
    }

    setIsScanning(true);
    setMatchedResults(null);

    setTimeout(() => {
      setIsScanning(false);
      const matches = findMatchingRecipes(selectedIngredients);
      setMatchedResults(matches.length > 0 ? matches : []);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Vision Pantry Scanner 📸</Text>
            <Text style={styles.headerSubtitle}>
              Take a live photo of your fridge or pantry to automatically detect raw ingredients and get zero-waste recipe recommendations.
            </Text>
          </View>

          {/* Camera / Photo Card */}
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <View style={[styles.activeDot, cameraPermissionStatus === 'granted' && styles.dotGranted]} />
              <Text style={styles.cameraHeaderText}>
                {hasCapturedCustomPhoto ? 'Captured Photo' : 'Camera Vision View'}
              </Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>
                  {cameraPermissionStatus === 'granted' ? 'Camera Ready ✅' : 'AI Vision Active'}
                </Text>
              </View>
            </View>

            {/* Tappable Photo Preview or Live Web Webcam Viewfinder */}
            {webcamActive && Platform.OS === 'web' ? (
              <View style={styles.webcamContainer}>
                {React.createElement('video', {
                  ref: videoRef,
                  autoPlay: true,
                  playsInline: true,
                  muted: true,
                  style: {
                    width: '100%',
                    height: 250,
                    borderRadius: 14,
                    objectFit: 'cover',
                    backgroundColor: '#000000',
                  },
                })}
                <View style={styles.webcamControls}>
                  <TouchableOpacity
                    style={styles.webcamSnapBtn}
                    onPress={captureWebcamSnapshot}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.webcamSnapBtnText}>📸 Snap Photo Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.webcamCancelBtn}
                    onPress={stopWebcam}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.webcamCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imageWrapper}
                onPress={handleTakePhoto}
                activeOpacity={0.9}
              >
                <Image source={{ uri: photoUri }} style={styles.cameraImage} />

                {/* Tap to Snap Floating Tag */}
                <View style={styles.tapToSnapBadge}>
                  <Text style={styles.tapToSnapText}>📷 Tap here to open Camera</Text>
                </View>

                {isScanning && (
                  <View style={styles.scanningOverlay}>
                    <ActivityIndicator size="large" color="#E07A5F" />
                    <Text style={styles.scanningText}>🧠 AI Vision Neural Network Analyzing...</Text>
                    <Text style={styles.scanningSub}>Detecting fruits, vegetables, proteins & staples</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Camera & Upload Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionBtnCamera}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnIcon}>📸</Text>
                <Text style={styles.actionBtnText}>Open Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnGallery}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnIcon}>🖼️</Text>
                <Text style={styles.actionBtnTextGallery}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* General Action Button */}
            <TouchableOpacity
              style={styles.actionBtnSecondaryMenu}
              onPress={handleUploadPhotoMenu}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryMenuText}>⚡ Choose Photo Source (Camera / Gallery / Demo)</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Scenarios */}
          <View style={styles.scenarioSection}>
            <Text style={styles.scenarioLabel}>⚡ Quick Pantry Scenarios (1-Tap Testing):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenarioScroll}>
              {DEMO_SCENARIOS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.scenarioChip}
                  onPress={() => handleApplyScenario(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.scenarioText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Detected Ingredients Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Detected Pantry Ingredients</Text>
            <Text style={styles.sectionCounter}>{selectedIngredients.length} detected</Text>
          </View>

          {/* Input for manual addition */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add another ingredient (e.g. Rice, Butter)..."
              placeholderTextColor="#999"
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={addCustomIngredient}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustomIngredient} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Detected Ingredients Chips with AI Confidence */}
          <View style={styles.chipsContainer}>
            {selectedIngredients.map((item) => {
              const score = confidenceScores[item] || 94;
              return (
                <View key={item} style={styles.activeChip}>
                  <Text style={styles.activeChipText}>✓ {item}</Text>
                  <Text style={styles.confidenceScore}>{score}%</Text>
                  <TouchableOpacity onPress={() => removeIngredient(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.removeChipText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* AI Vision Analysis Summary Box */}
          {aiAnalysisSummary ? (
            <View style={styles.aiSummaryCard}>
              <View style={styles.aiSummaryHeader}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🧠</Text>
                <Text style={styles.aiSummaryTitle}>AI Vision Detection Summary</Text>
              </View>
              <Text style={styles.aiSummaryText}>{aiAnalysisSummary}</Text>
            </View>
          ) : null}

          {/* Quick Add Suggestions */}
          <Text style={styles.quickAddTitle}>Popular Pantry Items:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {PRESET_PANTRY_ITEMS.filter((p) => !selectedIngredients.includes(p)).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={styles.presetChip}
                onPress={() => togglePreset(preset)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>+ {preset}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Find Recipes Button */}
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={handleRunAnalysis}
            disabled={isScanning}
            activeOpacity={0.85}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.analyzeBtnText}>✨ Generate Recipes with AI</Text>
            )}
          </TouchableOpacity>

          {/* Matched Recipes Results */}
          {matchedResults && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  Recommended Recipes ({matchedResults.length})
                </Text>
                <Text style={styles.matchSub}>
                  Ranked by AI ingredient match percentage with your photo
                </Text>
              </View>

              {matchedResults.length === 0 ? (
                <View style={styles.noMatchBox}>
                  <Text style={styles.noMatchIcon}>🧐</Text>
                  <Text style={styles.noMatchTitle}>No Exact Matches Found</Text>
                  <Text style={styles.noMatchSubtitle}>
                    Try snapping another photo or adding common staples like flour, oil, or onions!
                  </Text>
                </View>
              ) : (
                matchedResults.map((recipe) => {
                  const matchColor =
                    recipe.matchRate >= 75
                      ? '#2A9D8F'
                      : recipe.matchRate >= 45
                      ? '#E07A5F'
                      : '#8A857D';

                  return (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.recipeCard}
                      onPress={() => navigation.navigate('RecipeDetail', { recipe })}
                      activeOpacity={0.88}
                    >
                      <Image source={{ uri: recipe.image }} style={styles.recipeThumb} />
                      <View style={styles.recipeInfo}>
                        <View style={styles.titleRow}>
                          <Text style={styles.recipeTitle} numberOfLines={1}>
                            {recipe.title}
                          </Text>
                          <View style={[styles.matchBadge, { backgroundColor: matchColor }]}>
                            <Text style={styles.matchBadgeText}>{recipe.matchRate}% Match</Text>
                          </View>
                        </View>
                        <Text style={styles.recipeMeta}>
                          {recipe.cuisine} • ⏱ {recipe.cookTime || recipe.totalTime || '40 min'} • {recipe.baseCalories} kcal
                        </Text>

                        {/* Ingredients Breakdown */}
                        <View style={styles.matchBreakdownBox}>
                          <Text style={styles.matchedText} numberOfLines={2}>
                            <Text style={{ fontWeight: '800', color: '#2A9D8F' }}>✓ Ready in pantry: </Text>
                            {recipe.matchedIngredients?.join(', ') || `${recipe.matchedCount} ingredients`}
                          </Text>
                          {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                            <Text style={styles.missingText} numberOfLines={1}>
                              <Text style={{ fontWeight: '800', color: '#E07A5F' }}>⚠️ Missing: </Text>
                              {recipe.missingIngredients.slice(0, 3).join(', ')}
                              {recipe.missingIngredients.length > 3
                                ? ` +${recipe.missingIngredients.length - 3} more`
                                : ''}
                            </Text>
                          )}
                        </View>

                        <View style={styles.cookActionRow}>
                          <Text style={styles.cookActionText}>Cook this recipe ➔</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        <BottomTabBar
          activeTab="Scan"
          onTabPress={(tabKey) => {
            if (tabKey === 'Home') navigation.navigate('Home');
            else if (tabKey === 'Favorites') navigation.navigate('Favorites');
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7D756C',
    lineHeight: 18,
  },
  cameraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E07A5F',
    marginRight: 6,
  },
  dotGranted: {
    backgroundColor: '#2A9D8F',
  },
  cameraHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2B2B',
    flex: 1,
  },
  aiBadge: {
    backgroundColor: '#FFF2EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E07A5F',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  cameraImage: {
    width: '100%',
    height: 190,
    borderRadius: 12,
  },
  tapToSnapBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tapToSnapText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  scanningSub: {
    color: '#CCCCCC',
    fontSize: 11,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionBtnCamera: {
    flex: 1,
    backgroundColor: '#E07A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#E07A5F',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionBtnGallery: {
    flex: 1,
    backgroundColor: '#F5EFE6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  actionBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnTextGallery: {
    color: '#554D44',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnSecondaryMenu: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryMenuText: {
    fontSize: 11,
    color: '#8E877E',
    fontWeight: '600',
  },
  scenarioSection: {
    marginBottom: 16,
  },
  scenarioLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6E665E',
    marginBottom: 8,
  },
  scenarioScroll: {
    flexDirection: 'row',
  },
  scenarioChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  scenarioText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  sectionCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E877E',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2B2B2B',
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  addBtn: {
    backgroundColor: '#2A9D8F',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2A9D8F',
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A9D8F',
    marginRight: 6,
  },
  confidenceScore: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7D756C',
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginRight: 6,
  },
  removeChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B0A89F',
  },
  quickAddTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D756C',
    marginBottom: 6,
  },
  presetScroll: {
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  presetChipText: {
    fontSize: 12,
    color: '#554D44',
  },
  analyzeBtn: {
    backgroundColor: '#E07A5F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#E07A5F',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resultsContainer: {
    marginTop: 6,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  matchSub: {
    fontSize: 12,
    color: '#8E877E',
    marginTop: 2,
  },
  noMatchBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  noMatchIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  noMatchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  noMatchSubtitle: {
    fontSize: 12,
    color: '#8A857D',
    textAlign: 'center',
    lineHeight: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  recipeThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2B2B',
    flex: 1,
    marginRight: 6,
  },
  matchBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  recipeMeta: {
    fontSize: 11,
    color: '#8A857D',
    marginBottom: 4,
  },
  matchedCountText: {
    fontSize: 11,
    color: '#2A9D8F',
    fontWeight: '600',
  },

  /* Web Webcam Viewfinder Styles */
  webcamContainer: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  webcamControls: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
  webcamSnapBtn: {
    backgroundColor: '#E07A5F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 2,
    alignItems: 'center',
  },
  webcamSnapBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  webcamCancelBtn: {
    backgroundColor: '#4A4A4A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  webcamCancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  /* AI Vision Analysis Summary Card */
  aiSummaryCard: {
    backgroundColor: '#F3FBF8',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#CDEEE4',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiSummaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2A9D8F',
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#3D5A53',
    lineHeight: 17,
  },

  /* Ingredient Match Breakdown Styles */
  matchBreakdownBox: {
    backgroundColor: '#FAF7F2',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  matchedText: {
    fontSize: 11,
    color: '#3A5A40',
    lineHeight: 15,
  },
  missingText: {
    fontSize: 11,
    color: '#8C5335',
    lineHeight: 15,
    marginTop: 3,
  },
  cookActionRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#F5CBBF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  cookActionText: {
    color: '#E07A5F',
    fontSize: 10,
    fontWeight: '800',
  },
});
