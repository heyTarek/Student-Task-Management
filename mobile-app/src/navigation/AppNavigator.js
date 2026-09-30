import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { TaskProvider } from '../context/TaskContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import TaskFormScreen from '../screens/TaskFormScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import { ActivityIndicator, View, Platform } from 'react-native';

const Stack = createStackNavigator();

const headerOptions = {
  headerStyle: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowOpacity: 0.08,
  },
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    color: '#2c3e50',
  },
  headerTintColor: '#3498db',
  headerTitleAlign: 'center',
  headerBackTitleVisible: false,
};

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Main">
          {() => (
            <TaskProvider>
              <Stack.Navigator screenOptions={headerOptions}>
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="TaskForm"
                  component={TaskFormScreen}
                  options={{ title: 'New Task' }}
                />
                <Stack.Screen
                  name="TaskDetail"
                  component={TaskDetailScreen}
                  options={{ title: 'Task Details' }}
                />
              </Stack.Navigator>
            </TaskProvider>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
