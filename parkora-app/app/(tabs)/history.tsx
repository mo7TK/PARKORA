import { StyleSheet, Text, View } from "react-native";

export default function History() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>History coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },
  text: {
    fontSize: 16,
    color: "#aaa",
  },
});

/*the main map is the main tab other tabs will be added later as fav parkings and profile and history , dont forget to add a pointer of my position and Blue locate button should be on right just ont the top of the card sheet , also make sur , that the parking cards slide horizentaly, also make card shit slid to appeart and slid to dispear */
