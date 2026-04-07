import { Stack } from "expo-router";

export default function ParkingLayout() {
  return (
    <Stack>
      <Stack.Screen name="details" options={{ title: "Parking Details" }} />
      <Stack.Screen name="minimap" options={{ title: "Parking Layout" }} />
    </Stack>
  );
}
