import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AvailableDeliveriesScreen from '../screens/courier/AvailableDeliveriesScreen';
import CourierDeliveryDetailScreen from '../screens/courier/CourierDeliveryDetailScreen';
import CourierDeliveriesScreen from '../screens/courier/CourierDeliveriesScreen';
import CourierEarningsScreen from '../screens/courier/CourierEarningsScreen';
import CourierVerificationScreen from '../screens/auth/CourierVerificationScreen';
import TrackingScreen from '../screens/shared/TrackingScreen';
import RateDeliveryScreen from '../screens/shared/RateDeliveryScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function CourierNavigator() {
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
        name="AvailableDeliveries"
        component={AvailableDeliveriesScreen}
        options={{ title: 'Available Deliveries' }}
      />
      <Stack.Screen
        name="CourierDeliveryDetail"
        component={CourierDeliveryDetailScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen
        name="CourierDeliveries"
        component={CourierDeliveriesScreen}
        options={{ title: 'My Deliveries' }}
      />
      <Stack.Screen
        name="CourierEarnings"
        component={CourierEarningsScreen}
        options={{ title: 'Earnings' }}
      />
      <Stack.Screen
        name="CourierVerification"
        component={CourierVerificationScreen}
        options={{ title: 'Courier Verification' }}
      />
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ title: 'Delivery Tracking' }}
      />
      <Stack.Screen
        name="RateDelivery"
        component={RateDeliveryScreen}
        options={{ title: 'Rate Delivery' }}
      />
    </Stack.Navigator>
  );
}
