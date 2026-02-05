import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../components/LoadingScreen';

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in → auth flow
  if (!session) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Logged in but no profile yet → show auth flow for onboarding
  // (PhoneVerification, RoleSelection, CourierVerification)
  if (!profile || !profile.role) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Fully onboarded → main app
  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}
