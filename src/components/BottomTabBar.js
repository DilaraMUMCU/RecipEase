import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BottomTabBar({ activeTab, onTabPress }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: '🏠' },
    { key: 'Favorites', label: 'Favorites', icon: '🤍' },
    { key: 'Scan', label: 'AI Scan', icon: '📸' },
    { key: 'Profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {tab.key === 'Favorites' && isActive ? '❤️' : tab.icon}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
    paddingVertical: 8,
    paddingBottom: 14,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E877E',
  },
  tabLabelActive: {
    color: '#2B2B2B',
    fontWeight: '800',
  },
});
