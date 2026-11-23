import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRecipes } from '../context/RecipeContext';
import BottomTabBar from '../components/BottomTabBar';

const DIETARY_OPTIONS = [
  { id: 'Vegetarian', label: 'Vegetarian', icon: '🥗', desc: 'No meat, poultry, or seafood' },
  { id: 'Vegan', label: 'Vegan', icon: '🌱', desc: 'Strictly 100% plant-based ingredients' },
  { id: 'Gluten-Free', label: 'Gluten-Free', icon: '🌾', desc: 'No wheat, barley, rye, or gluten' },
  { id: 'Dairy-Free', label: 'Dairy-Free', icon: '🥛', desc: 'No milk, butter, cheese, or lactose' },
  { id: 'Low-Carb', label: 'Keto / Low-Carb', icon: '🥑', desc: 'High healthy fats, minimal carbohydrates' },
  { id: 'Halal', label: 'Halal', icon: '🌙', desc: 'Compliant with Islamic dietary laws' },
  { id: 'Nut-Free', label: 'Nut-Free', icon: '🥜', desc: 'Safe from tree nuts and peanuts' },
];

export default function ProfileScreen({ navigation }) {
  const {
    userProfile,
    measurementSystem,
    setMeasurementSystem,
    dietaryPreferences = [],
    toggleDietaryPreference,
  } = useRecipes();

  const [showDietaryModal, setShowDietaryModal] = useState(false);

  const handleToggleMeasurement = () => {
    const nextSystem = measurementSystem === 'Metric' ? 'Imperial' : 'Metric';
    setMeasurementSystem(nextSystem);
    Alert.alert(
      'Measurement System Updated 📏',
      `All recipe ingredients will now automatically adapt to the ${nextSystem} system (${
        nextSystem === 'Metric' ? 'Grams, Milliliters, Celsius' : 'Ounces, Cups, Fahrenheit'
      }).`
    );
  };

  const menuItems = [
    {
      title: 'Account Details',
      icon: '👤',
      action: () =>
        Alert.alert(
          'Account Details',
          `Name: ${userProfile.name}\nEmail: ${userProfile.email}\nSubscription: Premium (Free Student Tier)`
        ),
    },
    {
      title: 'Dietary Preferences',
      icon: '🥗',
      badge: dietaryPreferences.length > 0 ? `${dietaryPreferences.length} Selected` : 'None',
      highlight: dietaryPreferences.length > 0,
      action: () => setShowDietaryModal(true),
    },
    {
      title: 'Measurement System',
      icon: '📏',
      badge: measurementSystem,
      highlight: true,
      action: handleToggleMeasurement,
    },
    {
      title: 'Language',
      icon: '🌐',
      badge: userProfile.language,
      action: () =>
        Alert.alert(
          'Language Selection',
          'Current Language: English\n(Turkish localization planned for v1.2)'
        ),
    },
    {
      title: 'App Settings',
      icon: '⚙️',
      action: () =>
        Alert.alert(
          'App Settings',
          '• Hands-Free Voice Control: Enabled\n• Auto-convert Units: Enabled\n• Smart Pantry Alerts: Enabled'
        ),
    },
    {
      title: 'Help & Support',
      icon: '❓',
      action: () =>
        Alert.alert(
          'RecipEase Support',
          'Contact: support@recipease.app\nFounder: Dilara MUMCU (dilaramumcu@ogr.iu.edu.tr)'
        ),
    },
    {
      title: 'Log Out',
      icon: '🚪',
      action: () =>
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive' },
        ]),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Title */}
          <Text style={styles.headerTitle}>Profile & Settings</Text>

          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>
          </View>

          {/* Active Dietary Lifestyle Overview Card */}
          <View style={styles.dietaryOverviewCard}>
            <View style={styles.dietaryHeaderRow}>
              <View style={styles.dietaryTitleRow}>
                <Text style={styles.dietarySectionIcon}>🥗</Text>
                <Text style={styles.dietarySectionTitle}>Dietary Preferences</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDietaryModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dietaryEditLink}>Customize ✏️</Text>
              </TouchableOpacity>
            </View>

            {dietaryPreferences.length === 0 ? (
              <Text style={styles.dietaryEmptyText}>
                No dietary restrictions selected. Tap "Customize" to personalize your meal recommendations.
              </Text>
            ) : (
              <View style={styles.dietaryBadgeWrap}>
                {dietaryPreferences.map((pref) => {
                  const opt = DIETARY_OPTIONS.find((o) => o.id === pref);
                  return (
                    <TouchableOpacity
                      key={pref}
                      style={styles.dietaryPill}
                      onPress={() => setShowDietaryModal(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dietaryPillIcon}>{opt?.icon || '🥗'}</Text>
                      <Text style={styles.dietaryPillText}>{pref}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Preference Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>💡</Text>
            <Text style={styles.infoBannerText}>
              Universal Recipe Localization is active. Changing the measurement system below
              automatically adapts every recipe in real-time.
            </Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast,
                  item.highlight && styles.menuItemHighlight,
                ]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>

                <View style={styles.menuRight}>
                  {item.badge && (
                    <View
                      style={[
                        styles.badge,
                        item.highlight && styles.badgeHighlight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.highlight && styles.badgeTextHighlight,
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Project Details Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>RecipEase v1.0.0 (MVP)</Text>
            <Text style={styles.footerSub}>
              Mobile Application Development Final Project
            </Text>
          </View>
        </ScrollView>

        {/* Interactive Dietary Preferences Modal */}
        <Modal
          visible={showDietaryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDietaryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>🥗 Dietary Preferences</Text>
                  <Text style={styles.modalSubtitle}>
                    Select your lifestyle choices & restrictions
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowDietaryModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {DIETARY_OPTIONS.map((opt) => {
                  const isSelected = dietaryPreferences.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.dietaryOptionCard,
                        isSelected && styles.dietaryOptionCardSelected,
                      ]}
                      onPress={() => toggleDietaryPreference(opt.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dietaryOptionIcon}>{opt.icon}</Text>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          style={[
                            styles.dietaryOptionLabel,
                            isSelected && styles.dietaryOptionLabelSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={styles.dietaryOptionDesc}>{opt.desc}</Text>
                      </View>

                      <View
                        style={[
                          styles.dietaryCheckbox,
                          isSelected && styles.dietaryCheckboxSelected,
                        ]}
                      >
                        {isSelected && <Text style={styles.dietaryCheckmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => {
                  setShowDietaryModal(false);
                  Alert.alert(
                    'Preferences Saved! 🥗',
                    `Your active dietary lifestyle: ${
                      dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'None'
                    }.`
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveBtnText}>
                  Save Preferences ({dietaryPreferences.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <BottomTabBar
          activeTab="Profile"
          onTabPress={(tab) => {
            if (tab === 'Home') navigation.navigate('Home');
            else if (tab === 'Favorites') navigation.navigate('Favorites');
            else if (tab === 'Scan') navigation.navigate('Scan');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF7F2' },
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE9DE',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarIcon: {
    fontSize: 26,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#706A60',
  },

  /* Dietary Overview Card */
  dietaryOverviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  dietaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dietaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietarySectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dietarySectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  dietaryEditLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E07A5F',
  },
  dietaryEmptyText: {
    fontSize: 12,
    color: '#8A857D',
    fontStyle: 'italic',
  },
  dietaryBadgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FBF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B8E5D8',
  },
  dietaryPillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dietaryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A9D8F',
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoBannerIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    flex: 1,
  },

  /* Menu Items */
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemHighlight: {
    backgroundColor: '#FFFDF9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeHighlight: {
    backgroundColor: '#D97706',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#706A60',
  },
  badgeTextHighlight: {
    color: '#FFFFFF',
  },
  arrow: {
    fontSize: 20,
    color: '#A8A29A',
    fontWeight: '300',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8A857D',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFEAE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  modalScroll: {
    marginBottom: 16,
  },
  dietaryOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EFEAE2',
  },
  dietaryOptionCardSelected: {
    borderColor: '#2A9D8F',
    backgroundColor: '#F3FBF8',
  },
  dietaryOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dietaryOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  dietaryOptionLabelSelected: {
    color: '#2A9D8F',
  },
  dietaryOptionDesc: {
    fontSize: 11,
    color: '#8A857D',
    marginTop: 2,
  },
  dietaryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4CDC3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietaryCheckboxSelected: {
    borderColor: '#2A9D8F',
    backgroundColor: '#2A9D8F',
  },
  dietaryCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalSaveBtn: {
    backgroundColor: '#E07A5F',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#E07A5F',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A857D',
  },
  footerSub: {
    fontSize: 11,
    color: '#ABA499',
    marginTop: 2,
  },
});
