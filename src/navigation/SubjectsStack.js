import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SubjectsScreen from '../screens/SubjectsScreen';
import SubjectDetailScreen from '../screens/SubjectDetailScreen';

const Stack = createNativeStackNavigator();

export default function SubjectsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SubjectsList"
        component={SubjectsScreen}
        options={{ title: 'Modules', headerTitleAlign: 'center' }} 
      />
      <Stack.Screen
        name="SubjectDetail"
        component={SubjectDetailScreen}
        options={{ title: 'Module', headerTitleAlign: 'center' }}
      /> 
    </Stack.Navigator>
  );
} 