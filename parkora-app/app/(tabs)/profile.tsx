import { StyleSheet, Text, View } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile coming soon</Text>
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
