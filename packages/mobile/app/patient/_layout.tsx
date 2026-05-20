import { View } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function PatientLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
