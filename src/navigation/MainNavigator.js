import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import SenderNavigator from './SenderNavigator';
import CourierNavigator from './CourierNavigator';
import ProfileNavigator from './ProfileNavigator';
import AdminNavigator from './AdminNavigator';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }) {
  const icons = {
    Send: focused ? '📦' : '📦',
    Deliver: focused ? '🚗' : '🚗',
    Profile: focused ? '👤' : '👤',
    Admin: focused ? '🛡️' : '🛡️',
  };
  return <Text style={{ fontSize: 22 }}>{icons[label] || '•'}</Text>;
}

export default function MainNavigator() {
  const { profile } = useAuth();
  const role = profile?.role || 'sender';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {(role === 'sender' || role === 'both') && (
        <Tab.Screen
          name="SendTab"
          component={SenderNavigator}
          options={{
            tabBarLabel: 'Send',
            tabBarIcon: ({ focused }) => <TabIcon label="Send" focused={focused} />,
          }}
        />
      )}
      {(role === 'courier' || role === 'both') && (
        <Tab.Screen
          name="DeliverTab"
          component={CourierNavigator}
          options={{
            tabBarLabel: 'Deliver',
            tabBarIcon: ({ focused }) => <TabIcon label="Deliver" focused={focused} />,
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
      {role === 'admin' && (
        <Tab.Screen
          name="AdminTab"
          component={AdminNavigator}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ focused }) => <TabIcon label="Admin" focused={focused} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}
