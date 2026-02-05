import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/shared/ProfileScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import DeliveryHistoryScreen from '../screens/shared/DeliveryHistoryScreen';
import CourierEarningsScreen from '../screens/courier/CourierEarningsScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="DeliveryHistory"
        component={DeliveryHistoryScreen}
        options={{ title: 'Delivery History' }}
      />
      <Stack.Screen
        name="CourierEarnings"
        component={CourierEarningsScreen}
        options={{ title: 'Earnings' }}
      />
    </Stack.Navigator>
  );
}
