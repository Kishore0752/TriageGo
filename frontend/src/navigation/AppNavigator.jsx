import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen    from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f7fa' },
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
            transform: [{
              translateX: current.progress.interpolate({
                inputRange:  [0, 1],
                outputRange: [layouts.screen.width * 0.08, 0],
              }),
            }],
          },
        }),
      }}
    >
      <Stack.Screen name="Home"    component={HomeScreen}    />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}