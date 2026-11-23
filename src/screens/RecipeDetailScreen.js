import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useRecipes } from '../context/RecipeContext';
import { getStepVisual } from '../utils/stepVisualizer';

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const {
    isFavorite,
    toggleFavorite,
    measurementSystem,
    setMeasurementSystem,
    formatIngredientAmount,
  } = useRecipes();

  const baseServings = recipe.baseServings || 4;
  const [servings, setServings] = useState(baseServings);
  const [substituted, setSubstituted] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  // Smart Substitution Multi-Choice Modal State
  const [substitutionModalVisible, setSubstitutionModalVisible] = useState(false);
  const [activeIngredientForSub, setActiveIngredientForSub] = useState(null);

  // Interactive Step-by-Step Cooking Assistant State
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredientsDrawer, setShowIngredientsDrawer] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Hands-Free Voice Assistant State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voiceState, setVoiceState] = useState(Platform.OS === 'web' ? 'listening' : 'mobile');
  const [lastHeardWord, setLastHeardWord] = useState('');
  const [voiceFeedbackMessage, setVoiceFeedbackMessage] = useState('Say "Geç", "Sıradaki", or "Geri"');
  const speechRecognitionRef = useRef(null);
  const networkErrorCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const isComponentMountedRef = useRef(true);
  const currentStepIndexRef = useRef(currentStepIndex);

  const favorited = isFavorite(recipe.id);

  // Dynamically calculate calories based on servings
  const currentCalories = Math.round((recipe.baseCalories * servings) / baseServings);

  // Step visual information
  const currentStepText = recipe.steps[currentStepIndex] || '';
  const currentStepVisual = getStepVisual(recipe.id, currentStepIndex, currentStepText);

  // Keep ref synchronized with currentStepIndex
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  // Track component mount status
  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Parse time mentioned in a step (e.g. "30 minutes", "10 min")
  const extractStepTimerMinutes = (stepText) => {
    const match = (stepText || '').match(/(\d+)\s*(?:minutes|min|mins|saat|dakika)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const detectedTimerMinutes = extractStepTimerMinutes(currentStepText);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      speakStep('Zaman doldu! Aşama süresi tamamlandı.');
      Alert.alert('⏰ Timer Finished!', `Time is up for Step ${currentStepIndex + 1}!`);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startStepTimer = (minutes) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  };

  const stopStepTimer = () => {
    setIsTimerRunning(false);
  };

  const formatTimerTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // NATIVE TEXT-TO-SPEECH (SESLENDİRME ENGINE - EXPO-SPEECH)
  // =========================================================================
  const speakStep = (text) => {
    if (!text) return;
    try {
      Speech.stop();
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'tr-TR',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (e) {
      setIsSpeaking(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'tr-TR';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        } catch (err) {}
      }
    }
  };

  const stopSpeaking = () => {
    try {
      Speech.stop();
    } catch (e) {}
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
  };

  const speakCurrentStep = () => {
    const activeText = recipe.steps[currentStepIndexRef.current] || currentStepText;
    speakStep(`Aşama ${currentStepIndexRef.current + 1}: ${activeText}`);
  };

  // Cooking Mode Navigation Handlers
  const handleStartCooking = () => {
    setCurrentStepIndex(0);
    setIsCookingMode(true);
    setShowIngredientsDrawer(false);
    setIsTimerRunning(false);
    networkErrorCountRef.current = 0;
    setVoiceFeedbackMessage('Say "Geç", "Sıradaki", or "Geri"');
    const firstStep = recipe.steps[0] || '';
    if (firstStep) {
      setTimeout(() => {
        speakStep(`Aşama 1: ${firstStep}`);
      }, 400);
    }
  };

  const handleNextStep = () => {
    setCompletedSteps((prev) => ({ ...prev, [currentStepIndexRef.current]: true }));
    setIsTimerRunning(false);
    setCurrentStepIndex((prev) => {
      const nextIdx = prev < recipe.steps.length - 1 ? prev + 1 : prev;
      if (nextIdx !== prev) {
        const nextStepText = recipe.steps[nextIdx] || '';
        setTimeout(() => {
          speakStep(`Aşama ${nextIdx + 1}: ${nextStepText}`);
        }, 250);
      } else {
        speakStep('Tebrikler! Bütün tarif aşamalarını tamamladınız.');
      }
      return nextIdx;
    });
  };

  const handlePrevStep = () => {
    setIsTimerRunning(false);
    setCurrentStepIndex((prev) => {
      const prevIdx = prev > 0 ? prev - 1 : 0;
      if (prevIdx !== prev) {
        const prevStepText = recipe.steps[prevIdx] || '';
        setTimeout(() => {
          speakStep(`Aşama ${prevIdx + 1}: ${prevStepText}`);
        }, 250);
      }
      return prevIdx;
    });
  };

  const handleRestartCooking = () => {
    setCurrentStepIndex(0);
    setCompletedSteps({});
    setIsTimerRunning(false);
    const firstStep = recipe.steps[0] || '';
    if (firstStep) {
      setTimeout(() => {
        speakStep(`Aşama 1: ${firstStep}`);
      }, 300);
    }
  };

  const handleExitCooking = () => {
    stopSpeaking();
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {}
    }
    setIsCookingMode(false);
  };

  // =========================================================================
  // HANDS-FREE VOICE ASSISTANT ENGINE (Sesle Aşama Atlama)
  // =========================================================================

  // Voice Command Dispatcher: triggers actions based on spoken words
  const dispatchVoiceCommand = (commandText) => {
    const clean = (commandText || '').trim().toLowerCase();
    if (!clean) return;
    setLastHeardWord(clean);

    // 1. Next Step Triggers: "geç", "sıradaki", "sonraki", "ileri", "tamam", "bitti", "next", "continue", "done"
    const nextTriggers = ['geç', 'gec', 'sıradaki', 'siradaki', 'sonraki', 'ileri', 'tamam', 'bitti', 'next', 'step', 'done', 'continue'];
    if (nextTriggers.some((t) => clean.includes(t))) {
      setVoiceFeedbackMessage(`Komut Algılandı: "${clean}" ➔ Sonraki Aşama! ➡️`);
      handleNextStep();
      return;
    }

    // 2. Previous Step Triggers: "geri", "önceki", "onceki", "back", "previous"
    const prevTriggers = ['geri', 'önceki', 'onceki', 'back', 'previous'];
    if (prevTriggers.some((t) => clean.includes(t))) {
      setVoiceFeedbackMessage(`Komut Algılandı: "${clean}" ➔ Önceki Aşama! ⬅️`);
      handlePrevStep();
      return;
    }

    // 3. Start Timer: "başlat", "baslat", "timer", "zamanlayıcı", "start"
    const timerTriggers = ['başlat', 'baslat', 'timer', 'zamanlayıcı', 'start'];
    if (timerTriggers.some((t) => clean.includes(t))) {
      if (detectedTimerMinutes) {
        setVoiceFeedbackMessage(`Komut Algılandı: "${clean}" ➔ Sayaç Başlatıldı (${detectedTimerMinutes}dk)! ⏱️`);
        startStepTimer(detectedTimerMinutes);
      } else {
        setVoiceFeedbackMessage(`Bu aşama için süre tanımlanmamış.`);
      }
      return;
    }

    // 4. Read Aloud: "oku", "read", "speak", "tekrar", "adımı oku"
    const readTriggers = ['oku', 'read', 'speak', 'adımı oku', 'adimi oku', 'tekrar', 'seslendir'];
    if (readTriggers.some((t) => clean.includes(t))) {
      setVoiceFeedbackMessage(`Komut Algılandı: "${clean}" ➔ Aşama seslendiriliyor 🔊`);
      speakCurrentStep();
      return;
    }

    // 5. Stop Voice: "dur", "sus", "stop", "sessiz", "kapat"
    const stopTriggers = ['dur', 'sus', 'stop', 'sessiz', 'kapat'];
    if (stopTriggers.some((t) => clean.includes(t))) {
      setVoiceFeedbackMessage(`Komut Algılandı: "${clean}" ➔ Ses durduruldu ⏹️`);
      stopSpeaking();
      return;
    }

    setVoiceFeedbackMessage(`Duyulan: "${clean}" ("Geç", "Sıradaki", "Geri", "Oku")`);
  };

  // Safe Web Speech Recognition starter
  const startListening = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setVoiceState('mobile');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('unsupported');
      setVoiceFeedbackMessage('Web speech is not supported in this browser. Use buttons below.');
      return;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Single utterance mode prevents Google gRPC stream timeouts!
      recognition.interimResults = false;
      recognition.lang = 'tr-TR';

      recognition.onstart = () => {
        networkErrorCountRef.current = 0;
        setVoiceState('listening');
        setVoiceFeedbackMessage('Listening... (Say "Geç", "Sıradaki", or "Geri")');
      };

      recognition.onresult = (event) => {
        networkErrorCountRef.current = 0;
        if (event.results && event.results.length > 0) {
          const transcript = event.results[event.results.length - 1][0].transcript;
          dispatchVoiceCommand(transcript);
        }
      };

      recognition.onerror = (e) => {
        const errType = e.error || 'unknown';
        if (errType === 'network') {
          networkErrorCountRef.current += 1;
          setVoiceState('network_error');
          setVoiceFeedbackMessage('Speech network unavailable. Use the buttons below.');
        } else if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setVoiceState('permission_denied');
          setVoiceFeedbackMessage('Microphone permission not granted in browser.');
        } else if (errType === 'no-speech') {
          // Benign timeout when silent
        } else {
          setVoiceFeedbackMessage(`Voice notice: ${errType}`);
        }
      };

      recognition.onend = () => {
        // PREVENT INFINITE LOOP: If network error occurred, do NOT auto-restart!
        if (networkErrorCountRef.current > 0) {
          setVoiceState('network_error');
          return;
        }

        // Only restart with backoff if voice mode is still enabled
        if (isCookingMode && isVoiceEnabled && isComponentMountedRef.current) {
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (isCookingMode && isVoiceEnabled && networkErrorCountRef.current === 0) {
              try {
                recognition.start();
              } catch (err) {}
            }
          }, 800);
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      setVoiceState('network_error');
    }
  };

  // Toggle Voice On / Off
  const handleToggleVoice = () => {
    if (isVoiceEnabled) {
      setIsVoiceEnabled(false);
      setVoiceState('off');
      stopSpeaking();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
      setVoiceFeedbackMessage('Voice mode turned off. Use buttons below.');
    } else {
      setIsVoiceEnabled(true);
      networkErrorCountRef.current = 0;
      setVoiceFeedbackMessage('Activating voice control...');
      startListening();
    }
  };

  // Manual reconnect for network error
  const handleRetryVoiceConnection = () => {
    networkErrorCountRef.current = 0;
    setVoiceState('listening');
    setVoiceFeedbackMessage('Reconnecting microphone...');
    startListening();
  };

  // Initialize Speech Recognition when entering cooking mode
  useEffect(() => {
    if (!isCookingMode || !isVoiceEnabled) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
      return;
    }

    startListening();

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [isCookingMode, isVoiceEnabled]);

  // Helper to parse multiple substitution choices from string
  const parseSubstituteOptions = (substituteStr) => {
    if (!substituteStr || typeof substituteStr !== 'string') {
      return ['Standard pantry alternative'];
    }
    const cleaned = substituteStr
      .replace(/\s+or\s+/gi, ', ')
      .replace(/\s*\/\s*(?![^(]*\))/g, ', ');
    const parts = cleaned
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

    return parts.length > 0 ? parts : [substituteStr];
  };

  // Open multi-choice substitution modal
  const handleSubstitute = (idx, ing) => {
    const options = parseSubstituteOptions(ing.substitute);
    setActiveIngredientForSub({
      idx,
      ing,
      options,
      currentSub: substituted[idx] || null,
    });
    setSubstitutionModalVisible(true);
  };

  const applySubstitutionChoice = (idx, choice) => {
    setSubstituted((prev) => ({
      ...prev,
      [idx]: choice,
    }));
    setSubstitutionModalVisible(false);
  };

  const revertSubstitution = (idx) => {
    setSubstituted((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
    setSubstitutionModalVisible(false);
  };

  const toggleStep = (idx) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this delicious ${recipe.title} on RecipEase! (${recipe.cookingTime || recipe.totalTime || 'Tasty recipe'})`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleSystem = () => {
    const next = measurementSystem === 'Metric' ? 'Imperial' : 'Metric';
    setMeasurementSystem(next);
  };

  const totalSteps = recipe.steps.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isCurrentStepCompleted = !!completedSteps[currentStepIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.image} />
          <View style={styles.cuisineBadge}>
            <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
          </View>

          <TouchableOpacity
            style={styles.floatingHeartBtn}
            onPress={() => toggleFavorite(recipe.id)}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.floatingHeartIcon}>{favorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title & Metadata */}
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{recipe.totalTime || recipe.cookTime || '45 min'}</Text>
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

          {recipe.isApiRecipe && (
            <View style={styles.apiSourceBanner}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>🌐</Text>
              <Text style={styles.apiSourceText}>
                Live Cloud Recipe from TheMealDB API • {recipe.cuisine} Cuisine
              </Text>
            </View>
          )}

          {/* Primary Action Button: START COOKING */}
          <TouchableOpacity
            style={styles.startCookingBanner}
            onPress={handleStartCooking}
            activeOpacity={0.85}
          >
            <View style={styles.startCookingIconBox}>
              <Text style={styles.startCookingIcon}>👨‍🍳</Text>
            </View>
            <View style={styles.startCookingTextBox}>
              <Text style={styles.startCookingTitle}>Start Cooking (Step-by-Step)</Text>
              <Text style={styles.startCookingSubtitle}>
                🎙️ Hands-free voice navigation ("Geç", "Sıradaki") & step visuals
              </Text>
            </View>
            <Text style={styles.startCookingArrow}>➔</Text>
          </TouchableOpacity>

          {/* Dynamic Portion Scaling Card */}
          <View style={styles.scalingCard}>
            <View style={styles.scalingTextContainer}>
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
                <Text style={styles.servingNumber} numberOfLines={1}>
                  {servings}
                </Text>
                <Text style={styles.servingLabel} numberOfLines={1}>
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

          {/* Ingredients Section Header + Unit Toggle */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.sectionCounter}>
                {recipe.ingredients.length} items for {servings} {servings === 1 ? 'serving' : 'servings'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.unitToggleBtn}
              onPress={handleToggleSystem}
              activeOpacity={0.8}
            >
              <Text style={styles.unitToggleText}>
                Unit: <Text style={{ fontWeight: '800' }}>{measurementSystem}</Text> ⇄
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ingredients List with Interactive Substitutions */}
          <View style={styles.ingredientsBox}>
            {recipe.ingredients.map((ing, idx) => {
              const isSubbed = substituted[idx];
              const { amount: displayAmount, unit: displayUnit } =
                formatIngredientAmount(ing, servings, baseServings);

              return (
                <View key={idx} style={[styles.ingredientRow, idx > 0 && styles.borderTop]}>
                  <View style={styles.ingredientLeft}>
                    <Text style={styles.bulletDot}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ingredientName, isSubbed && styles.subbedOriginalName]}>
                        {ing.name}
                      </Text>
                      {isSubbed && (
                        <View style={styles.subbedBadge}>
                          <Text style={styles.subbedBadgeText}>Swapped: {isSubbed}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.ingredientRight}>
                    {displayAmount ? (
                      <Text style={styles.amountBadge}>
                        {displayAmount} {displayUnit}
                      </Text>
                    ) : (
                      <Text style={styles.amountBadge}>{displayUnit || ing.unit}</Text>
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
                        {isSubbed ? 'Swapped ⇄' : 'Swap'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Step-by-Step Instructions with Visual Stage Badges */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Preparation Steps</Text>
            <Text style={styles.sectionCounter}>
              {recipe.steps.length} steps (tap to mark)
            </Text>
          </View>

          <View style={styles.stepsBox}>
            {recipe.steps.map((step, idx) => {
              const isDone = completedSteps[idx];
              const visual = getStepVisual(recipe.id, idx, step);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.stepCard, isDone && styles.stepCardDone]}
                  onPress={() => toggleStep(idx)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.stepNumberBadge,
                      isDone && styles.stepNumberBadgeDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumberText,
                        isDone && styles.stepNumberTextDone,
                      ]}
                    >
                      {isDone ? '✓' : idx + 1}
                    </Text>
                  </View>

                  <View style={styles.stepContent}>
                    <View style={styles.stepStagePill}>
                      <Text style={styles.stepStageIcon}>{visual.icon}</Text>
                      <Text style={styles.stepStageText}>{visual.stage}</Text>
                    </View>
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

          {/* Source citation */}
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
              style={styles.bottomCookBtn}
              onPress={handleStartCooking}
              activeOpacity={0.85}
            >
              <Text style={styles.bottomCookBtnText}>👨‍🍳 Start Cooking Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.shareBtnText}>Share 🔗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* FULLSCREEN STEP-BY-STEP COOKING ASSISTANT MODAL           */}
      {/* With Step Visuals & Hands-Free Voice Navigation ("Geç")  */}
      {/* ========================================================= */}
      <Modal
        visible={isCookingMode}
        animationType="slide"
        transparent={false}
        onRequestClose={handleExitCooking}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            {/* Modal Top Bar */}
            <View style={styles.modalTopBar}>
              <TouchableOpacity
                style={styles.modalExitBtn}
                onPress={handleExitCooking}
                activeOpacity={0.7}
              >
                <Text style={styles.modalExitText}>✕ Exit</Text>
              </TouchableOpacity>

              <View style={styles.modalRecipeTitleBox}>
                <Text style={styles.modalRecipeTitle} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Text style={styles.modalServingsInfo}>
                  Cooking for {servings} {servings === 1 ? 'person' : 'people'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalIngredientsBtn}
                onPress={() => setShowIngredientsDrawer(!showIngredientsDrawer)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalIngredientsBtnText}>
                  {showIngredientsDrawer ? '📖 Steps' : '📋 Ingredients'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            {/* ======================================================= */}
            {/* 🎙️ HANDS-FREE VOICE ASSISTANT BANNER                   */}
            {/* ======================================================= */}
            <View
              style={[
                styles.voiceAssistantBanner,
                voiceState === 'network_error' && styles.voiceBannerWarning,
                voiceState === 'permission_denied' && styles.voiceBannerWarning,
              ]}
            >
              <View style={styles.voiceLeftRow}>
                <View
                  style={[
                    styles.voiceMicPulse,
                    isVoiceEnabled && voiceState === 'listening' && styles.voiceMicPulseActive,
                    voiceState === 'network_error' && styles.voiceMicPulseWarning,
                    isSpeaking && styles.voiceMicPulseSpeaking,
                  ]}
                >
                  <Text style={styles.voiceMicIcon}>
                    {isSpeaking ? '🔊' : voiceState === 'network_error' ? '⚠️' : isVoiceEnabled ? '🎙️' : '🔇'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.voiceTitle}>
                    {isSpeaking
                      ? 'Sesli Anlatım Yapılıyor... 🔊'
                      : Platform.OS !== 'web'
                      ? 'Hands-Free Ses Asistanı (Mobil)'
                      : voiceState === 'network_error'
                      ? 'Web Konuşma Servisi Kapalı'
                      : voiceState === 'permission_denied'
                      ? 'Mikrofon İzni Gerekli'
                      : isVoiceEnabled
                      ? 'Hands-Free Ses: Dinliyor 🟢'
                      : 'Hands-Free Ses: Kapalı'}
                  </Text>
                  <Text style={styles.voiceFeedback} numberOfLines={2}>
                    {voiceFeedbackMessage}
                  </Text>
                </View>
              </View>

              <View style={styles.voiceActionBtnsRow}>
                {voiceState === 'network_error' && Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={styles.voiceRetryBtn}
                    onPress={handleRetryVoiceConnection}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.voiceRetryBtnText}>🔄 Retry</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.voiceToggleBtn, isVoiceEnabled && styles.voiceToggleBtnActive]}
                  onPress={handleToggleVoice}
                >
                  <Text style={styles.voiceToggleBtnText}>{isVoiceEnabled ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Hands-Free Voice Triggers */}
            <View style={styles.voiceSimRow}>
              <Text style={styles.voiceSimLabel}>Sesli Komut:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.voiceTriggerChip, styles.voiceTriggerChipPrimary]}
                  onPress={() => dispatchVoiceCommand('geç')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceTriggerTextPrimary}>🗣️ "Geç" ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.voiceTriggerChip}
                  onPress={() => dispatchVoiceCommand('sıradaki')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceTriggerText}>🗣️ "Sıradaki"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.voiceTriggerChip}
                  onPress={() => dispatchVoiceCommand('geri')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceTriggerText}>⬅️ "Geri"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voiceTriggerChip, isSpeaking && styles.voiceTriggerChipSpeaking]}
                  onPress={isSpeaking ? stopSpeaking : speakCurrentStep}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.voiceTriggerText, isSpeaking && styles.voiceTriggerTextSpeaking]}>
                    {isSpeaking ? '⏹️ "Durdur"' : '🔊 "Adımı Oku"'}
                  </Text>
                </TouchableOpacity>

                {detectedTimerMinutes ? (
                  <TouchableOpacity
                    style={styles.voiceTriggerChip}
                    onPress={() => dispatchVoiceCommand('başlat')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.voiceTriggerText}>⏱️ "Başlat"</Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </View>

            {/* Quick Voice / Text Input Box for Hands-Free Dictation */}
            <View style={styles.voiceInputBox}>
              <Text style={styles.voiceInputIcon}>🎙️</Text>
              <TextInput
                style={styles.voiceTextInput}
                placeholder='Mikrofonla "Geç", "Sıradaki", "Geri" deyin...'
                placeholderTextColor="#9CA3AF"
                value={voiceInputText}
                onChangeText={(txt) => {
                  setVoiceInputText(txt);
                  dispatchVoiceCommand(txt);
                }}
                returnKeyType="done"
                onSubmitEditing={() => setVoiceInputText('')}
              />
              {voiceInputText ? (
                <TouchableOpacity
                  style={styles.voiceClearBtn}
                  onPress={() => setVoiceInputText('')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceClearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.voiceSpeakNowBtn, isSpeaking && styles.voiceSpeakNowBtnActive]}
                  onPress={isSpeaking ? stopSpeaking : speakCurrentStep}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceSpeakNowBtnText}>
                    {isSpeaking ? '⏹️ Dur' : '🔊 Oku'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showIngredientsDrawer ? (
              /* Drawer: Quick Ingredients Checklist in Cooking Mode */
              <View style={styles.drawerContainer}>
                <Text style={styles.drawerTitle}>Quick Ingredients Checklist ({servings} servings)</Text>
                <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
                  {recipe.ingredients.map((ing, i) => {
                    const isSubbed = substituted[i];
                    const { amount: a, unit: u } = formatIngredientAmount(ing, servings, baseServings);
                    return (
                      <View key={i} style={styles.drawerItem}>
                        <Text style={styles.drawerItemBullet}>•</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.drawerItemName}>{ing.name}</Text>
                          {isSubbed && (
                            <Text style={styles.drawerSubbedText}>Swapped: {isSubbed}</Text>
                          )}
                        </View>
                        <Text style={styles.drawerItemAmount}>{a} {u}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              /* Active Step Card with High-Res Visual Illustration */
              <View style={styles.stepContainer}>
                {/* Step Header */}
                <View style={styles.stepHeaderRow}>
                  <View style={styles.activeStepBadge}>
                    <Text style={styles.activeStepBadgeText}>
                      STEP {currentStepIndex + 1} OF {totalSteps}
                    </Text>
                  </View>
                  <Text style={styles.percentText}>{progressPercent}% Completed</Text>
                </View>

                {/* Step Visual Card */}
                <View style={styles.visualCard}>
                  <Image source={{ uri: currentStepVisual.image }} style={styles.visualImage} />
                  <View style={styles.visualStageOverlay}>
                    <Text style={styles.visualIcon}>{currentStepVisual.icon}</Text>
                    <Text style={styles.visualStageName}>{currentStepVisual.stage}</Text>
                  </View>
                </View>

                {/* Main Instruction Card */}
                <View style={styles.instructionCard}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.instructionText}>
                      {currentStepText}
                    </Text>

                    {/* Pro-Chef Tip */}
                    <View style={styles.chefTipBox}>
                      <Text style={styles.chefTipIcon}>💡</Text>
                      <Text style={styles.chefTipText}>{currentStepVisual.tip}</Text>
                    </View>
                  </ScrollView>
                </View>

                {/* Built-in Smart Timer for this Step */}
                {detectedTimerMinutes ? (
                  <View style={styles.timerCard}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.timerTitle}>Suggested Timer: {detectedTimerMinutes} min</Text>
                      {isTimerRunning ? (
                        <Text style={styles.countdownText}>{formatTimerTime(timerSeconds)} remaining</Text>
                      ) : (
                        <Text style={styles.timerSubtitle}>Tap or say "Başlat" to start countdown</Text>
                      )}
                    </View>
                    {isTimerRunning ? (
                      <TouchableOpacity style={styles.timerStopBtn} onPress={stopStepTimer}>
                        <Text style={styles.timerBtnText}>Pause</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.timerStartBtn}
                        onPress={() => startStepTimer(detectedTimerMinutes)}
                      >
                        <Text style={styles.timerBtnText}>Start Timer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {/* Step Done Toggle Button */}
                <TouchableOpacity
                  style={[
                    styles.markDoneBtn,
                    isCurrentStepCompleted && styles.markDoneBtnActive,
                  ]}
                  onPress={() => toggleStep(currentStepIndex)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.markDoneBtnIcon}>
                    {isCurrentStepCompleted ? '✅' : '⚪'}
                  </Text>
                  <Text
                    style={[
                      styles.markDoneBtnText,
                      isCurrentStepCompleted && styles.markDoneBtnTextActive,
                    ]}
                  >
                    {isCurrentStepCompleted ? 'Step Completed' : 'Mark Step as Done'}
                  </Text>
                </TouchableOpacity>

                {/* Celebration Message on Last Step Completion */}
                {isLastStep && isCurrentStepCompleted && (
                  <View style={styles.celebrationBox}>
                    <Text style={styles.celebrationIcon}>🎉</Text>
                    <Text style={styles.celebrationTitle}>Bon Appétit! Dish is Ready!</Text>
                    <Text style={styles.celebrationSub}>
                      You completed all {totalSteps} steps for {recipe.title}.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Modal Bottom Navigation Controls */}
            <View style={styles.modalControlsRow}>
              <TouchableOpacity
                style={[styles.prevStepBtn, currentStepIndex === 0 && styles.btnDisabled]}
                onPress={handlePrevStep}
                disabled={currentStepIndex === 0}
                activeOpacity={0.7}
              >
                <Text style={[styles.prevStepText, currentStepIndex === 0 && styles.textDisabled]}>
                  ⬅ Geri (Prev)
                </Text>
              </TouchableOpacity>

              {isLastStep ? (
                <TouchableOpacity
                  style={styles.finishBtn}
                  onPress={() => {
                    setCompletedSteps((prev) => ({ ...prev, [currentStepIndex]: true }));
                    Alert.alert(
                      '🎉 Cooking Complete!',
                      `Delicious! You have prepared ${recipe.title}. Bon Appétit!`,
                      [
                        { text: 'Exit', onPress: () => setIsCookingMode(false) },
                        { text: 'Cook Again', onPress: handleRestartCooking },
                      ]
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.finishBtnText}>🎉 Finish Cooking</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.nextStepBtn}
                  onPress={handleNextStep}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextStepText}>Geç / Sıradaki ➔</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Multi-Option Substitution Selection Modal */}
      <Modal
        visible={substitutionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSubstitutionModalVisible(false)}
      >
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalCard}>
            <View style={styles.subModalHeader}>
              <View style={styles.subModalIconBox}>
                <Text style={{ fontSize: 22 }}>🔄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subModalTitle}>Ingredient Swap</Text>
                <Text style={styles.subModalSubtitle}>
                  Replace <Text style={{ fontWeight: '800', color: '#2B2B2B' }}>{activeIngredientForSub?.ing?.name}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSubstitutionModalVisible(false)}
                style={styles.subModalCloseX}
              >
                <Text style={{ fontSize: 16, color: '#888', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subModalSectionNote}>
              Select your preferred alternative option:
            </Text>

            <ScrollView style={styles.subOptionsList} showsVerticalScrollIndicator={false}>
              {activeIngredientForSub?.options?.map((option, oIdx) => {
                const isSelected = activeIngredientForSub?.currentSub === option;
                return (
                  <TouchableOpacity
                    key={oIdx}
                    style={[
                      styles.subOptionCard,
                      isSelected && styles.subOptionCardSelected,
                    ]}
                    onPress={() => applySubstitutionChoice(activeIngredientForSub.idx, option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subOptionLeft}>
                      <View style={[styles.subOptionRadio, isSelected && styles.subOptionRadioSelected]}>
                        {isSelected && <View style={styles.subOptionRadioInner} />}
                      </View>
                      <Text style={[styles.subOptionText, isSelected && styles.subOptionTextSelected]}>
                        {option}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.subOptionActiveBadge}>
                        <Text style={styles.subOptionActiveBadgeText}>Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* If currently substituted, allow reverting back */}
            {activeIngredientForSub?.currentSub && (
              <TouchableOpacity
                style={styles.subRevertBtn}
                onPress={() => revertSubstitution(activeIngredientForSub.idx)}
                activeOpacity={0.8}
              >
                <Text style={styles.subRevertBtnText}>
                  ↩ Revert to Original ({activeIngredientForSub?.ing?.name})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.subCancelBtn}
              onPress={() => setSubstitutionModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.subCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  floatingHeartBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  floatingHeartIcon: {
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666057',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#443E37',
  },
  startCookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E07A5F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#E07A5F',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  startCookingIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  startCookingIcon: {
    fontSize: 24,
  },
  startCookingTextBox: {
    flex: 1,
  },
  startCookingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  startCookingSubtitle: {
    color: '#FFE7DF',
    fontSize: 11,
    lineHeight: 15,
  },
  startCookingArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 8,
  },
  scalingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  scalingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  scalingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  scalingSubtitle: {
    fontSize: 11,
    color: '#8A857D',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    flexShrink: 0,
    minHeight: 46,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
    lineHeight: 20,
  },
  servingNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 62,
    paddingHorizontal: 6,
  },
  servingNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2B2B',
    lineHeight: 18,
    textAlign: 'center',
  },
  servingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A857D',
    lineHeight: 12,
    marginTop: 1,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  sectionCounter: {
    fontSize: 12,
    color: '#8A857D',
    fontWeight: '600',
  },
  unitToggleBtn: {
    backgroundColor: '#EFEAE2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unitToggleText: {
    fontSize: 12,
    color: '#554D44',
  },
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F6F2EC',
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  bulletDot: {
    fontSize: 16,
    color: '#E07A5F',
    marginRight: 10,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  subbedOriginalName: {
    textDecorationLine: 'line-through',
    color: '#A8A198',
  },
  subbedBadge: {
    backgroundColor: '#FFF1EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  subbedBadgeText: {
    fontSize: 11,
    color: '#E07A5F',
    fontWeight: '700',
  },
  ingredientRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#554E45',
    marginRight: 8,
  },
  substituteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F5EFE6',
    borderWidth: 1,
    borderColor: '#E8E1D5',
  },
  substituteButtonActive: {
    backgroundColor: '#E07A5F',
    borderColor: '#E07A5F',
  },
  substituteButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6E665E',
  },
  substituteButtonTextActive: {
    color: '#FFFFFF',
  },
  stepsBox: {
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  stepCardDone: {
    backgroundColor: '#F7FBF9',
    borderColor: '#C3E5D8',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberBadgeDone: {
    backgroundColor: '#2A9D8F',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#554D44',
  },
  stepNumberTextDone: {
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepStagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 5,
  },
  stepStageIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  stepStageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E07A5F',
  },
  stepText: {
    fontSize: 14,
    color: '#3A3530',
    lineHeight: 20,
  },
  stepTextDone: {
    color: '#8A857D',
    textDecorationLine: 'line-through',
  },
  sourceFooter: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
    marginBottom: 16,
  },
  sourceText: {
    fontSize: 12,
    color: '#8A857D',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  bottomCookBtn: {
    flex: 2,
    backgroundColor: '#E07A5F',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCookBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  shareBtnText: {
    color: '#2B2B2B',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ========================================================= */
  /* MODAL STYLES (COOKING ASSISTANT & VOICE NAVIGATION)       */
  /* ========================================================= */
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE2',
  },
  modalExitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EFEAE2',
  },
  modalExitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#554E45',
  },
  modalRecipeTitleBox: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalRecipeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  modalServingsInfo: {
    fontSize: 11,
    color: '#8A857D',
  },
  modalIngredientsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#2A9D8F',
  },
  modalIngredientsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#EAE3D8',
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E07A5F',
    borderRadius: 3,
  },

  /* Voice Assistant Banner */
  voiceAssistantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E8DFD5',
  },
  voiceBannerWarning: {
    borderColor: '#F4A261',
    backgroundColor: '#FFFDF9',
  },
  voiceLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceMicPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMicPulseActive: {
    backgroundColor: '#FFE9E2',
    borderWidth: 1.5,
    borderColor: '#E07A5F',
  },
  voiceMicPulseWarning: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#F4A261',
  },
  voiceMicPulseSpeaking: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#2A9D8F',
  },
  voiceMicIcon: {
    fontSize: 16,
  },
  voiceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  voiceFeedback: {
    fontSize: 11,
    color: '#E07A5F',
    fontWeight: '600',
  },
  voiceActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  voiceRetryBtn: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  voiceRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  voiceToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFEAE2',
  },
  voiceToggleBtnActive: {
    backgroundColor: '#E07A5F',
  },
  voiceToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Voice Sim Bar */
  voiceSimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceSimLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A857D',
    marginRight: 6,
  },
  voiceTriggerChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  voiceTriggerChipPrimary: {
    backgroundColor: '#E07A5F',
    borderColor: '#D06A4F',
  },
  voiceTriggerChipSpeaking: {
    backgroundColor: '#2A9D8F',
    borderColor: '#21867A',
  },
  voiceTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#443E37',
  },
  voiceTriggerTextPrimary: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  voiceTriggerTextSpeaking: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Quick Voice Dictation Input Box */
  voiceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8DFD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  voiceInputIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  voiceTextInput: {
    flex: 1,
    fontSize: 12,
    color: '#2B2B2B',
    paddingVertical: 4,
    fontWeight: '600',
  },
  voiceClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voiceClearBtnText: {
    fontSize: 12,
    color: '#8A857D',
    fontWeight: '700',
  },
  voiceSpeakNowBtn: {
    backgroundColor: '#F4EAE1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  voiceSpeakNowBtnActive: {
    backgroundColor: '#2A9D8F',
  },
  voiceSpeakNowBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E07A5F',
  },

  /* Step Container */
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStepBadge: {
    backgroundColor: '#FFF2EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeStepBadgeText: {
    color: '#E07A5F',
    fontWeight: '800',
    fontSize: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A857D',
  },

  /* Visual Card for the Step */
  visualCard: {
    position: 'relative',
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#1C1917',
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
  visualStageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  visualIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  visualStageName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Instruction Card */
  instructionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EFEAE2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  instructionText: {
    fontSize: 17,
    lineHeight: 25,
    color: '#2B2B2B',
    fontWeight: '600',
  },
  chefTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF2',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3E5CB',
  },
  chefTipIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  chefTipText: {
    fontSize: 11,
    color: '#7D6337',
    flex: 1,
    lineHeight: 16,
  },

  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F8D8C9',
  },
  timerIcon: {
    fontSize: 22,
  },
  timerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E07A5F',
  },
  countdownText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A9D8F',
  },
  timerSubtitle: {
    fontSize: 10,
    color: '#8A857D',
  },
  timerStartBtn: {
    backgroundColor: '#E07A5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerStopBtn: {
    backgroundColor: '#D9534F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#EFEAE2',
  },
  markDoneBtnActive: {
    borderColor: '#2A9D8F',
    backgroundColor: '#F3FBF8',
  },
  markDoneBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  markDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E665E',
  },
  markDoneBtnTextActive: {
    color: '#2A9D8F',
  },
  celebrationBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  celebrationIcon: {
    fontSize: 26,
    marginBottom: 2,
  },
  celebrationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  celebrationSub: {
    fontSize: 11,
    color: '#388E3C',
    textAlign: 'center',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 10,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },
  drawerItemBullet: {
    color: '#E07A5F',
    fontSize: 15,
    marginRight: 8,
  },
  drawerItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  drawerSubbedText: {
    fontSize: 10,
    color: '#E07A5F',
    fontWeight: '600',
  },
  drawerItemAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#554D44',
  },
  modalControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
  },
  prevStepBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EAE3D8',
  },
  prevStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#554E45',
  },
  nextStepBtn: {
    flex: 2,
    backgroundColor: '#E07A5F',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E07A5F',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  nextStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  finishBtn: {
    flex: 2,
    backgroundColor: '#2A9D8F',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2A9D8F',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  finishBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.4,
    borderColor: '#E8E2D8',
  },
  textDisabled: {
    color: '#AAA',
  },

  /* Multi-Choice Substitution Modal Styles */
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subModalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  subModalSubtitle: {
    fontSize: 13,
    color: '#6E665E',
    marginTop: 2,
  },
  subModalCloseX: {
    padding: 6,
  },
  subModalSectionNote: {
    fontSize: 12,
    color: '#8A857D',
    fontWeight: '600',
    marginBottom: 12,
  },
  subOptionsList: {
    maxHeight: 280,
  },
  subOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#EFEAE2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  subOptionCardSelected: {
    backgroundColor: '#FFF4EE',
    borderColor: '#E07A5F',
  },
  subOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4BDB5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  subOptionRadioSelected: {
    borderColor: '#E07A5F',
  },
  subOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E07A5F',
  },
  subOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
    flex: 1,
  },
  subOptionTextSelected: {
    color: '#E07A5F',
    fontWeight: '800',
  },
  subOptionActiveBadge: {
    backgroundColor: '#E07A5F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subOptionActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  subRevertBtn: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD4D4',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  subRevertBtnText: {
    color: '#D9534F',
    fontSize: 13,
    fontWeight: '700',
  },
  subCancelBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 12,
  },
  subCancelBtnText: {
    color: '#8A857D',
    fontSize: 13,
    fontWeight: '600',
  },
  apiSourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#C3E9E0',
  },
  apiSourceText: {
    color: '#1B6A60',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});
