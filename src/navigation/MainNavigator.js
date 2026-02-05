import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();

// Simple Sender Home Screen
function SenderHomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Text style={styles.screenTitle}>My Deliveries</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Small electronics package</Text>
        <Text style={styles.cardSubtitle}>123 Main St → 456 Oak Ave</Text>
        <Text style={styles.cardStatus}>Status: Pending</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎁 Birthday gift - fragile</Text>
        <Text style={styles.cardSubtitle}>789 Pine Rd → 321 Elm St</Text>
        <Text style={styles.cardStatus}>Status: Pending</Text>
      </View>
    </ScrollView>
  );
}

// Simple Create Delivery Screen
function CreateDeliveryScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Create Delivery</Text>
      <Text style={styles.placeholder}>📍 Enter pickup address</Text>
      <Text style={styles.placeholder}>📍 Enter dropoff address</Text>
      <Text style={styles.placeholder}>📦 Describe your package</Text>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Create Delivery Request</Text>
      </Pressable>
    </View>
  );
}

// Simple Profile Screen
function ProfileScreen() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Email: {profile?.email || 'N/A'}</Text>
        <Text style={styles.cardSubtitle}>Role: {profile?.role || 'N/A'}</Text>
      </View>
      <Pressable style={styles.dangerButton} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

function TabIcon({ label }) {
  const icons = { Home: '📦', Create: '➕', Profile: '👤' };
  return <Text style={{ fontSize: 22 }}>{icons[label] || '•'}</Text>;
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={SenderHomeScreen}
        options={{
          tabBarLabel: 'Deliveries',
          tabBarIcon: () => <TabIcon label="Home" />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateDeliveryScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: () => <TabIcon label="Create" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <TabIcon label="Profile" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  screenContent: {
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    marginTop: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  dangerButton: {
    height: 52,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
