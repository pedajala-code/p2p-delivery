import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SenderDeliveriesScreen from '../screens/sender/SenderDeliveriesScreen';
import CreateDeliveryScreen from '../screens/sender/CreateDeliveryScreen';
import SenderDeliveryDetailScreen from '../screens/sender/SenderDeliveryDetailScreen';
import TrackingScreen from '../screens/shared/TrackingScreen';
import RateDeliveryScreen from '../screens/shared/RateDeliveryScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function SenderNavigator() {
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
        name="SenderDeliveries"
        component={SenderDeliveriesScreen}
        options={{ title: 'My Deliveries' }}
      />
      <Stack.Screen
        name="CreateDelivery"
        component={CreateDeliveryScreen}
        options={{ title: 'New Delivery' }}
      />
      <Stack.Screen
        name="SenderDeliveryDetail"
        component={SenderDeliveryDetailScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ title: 'Track Courier' }}
      />
      <Stack.Screen
        name="RateDelivery"
        component={RateDeliveryScreen}
        options={{ title: 'Rate Delivery' }}
      />
    </Stack.Navigator>
  );
}
