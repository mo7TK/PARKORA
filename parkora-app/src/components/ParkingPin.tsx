import { StyleSheet, Text, View } from "react-native";

export default function ParkingPin() {
  return (
    <View style={styles.pin}>
      <Text style={styles.pinText}>P</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
});
