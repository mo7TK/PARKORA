import { StyleSheet, Text, View } from "react-native";

export default function Favorites() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    justifyContent:  "center",
    alignItems:      "center",
    backgroundColor: "#f4f4f4",
  },
  text: {
    fontSize: 16,
    color:    "#aaa",
  },
});
