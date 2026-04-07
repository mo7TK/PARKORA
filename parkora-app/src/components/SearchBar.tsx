import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={18}
        color="#888"
        style={styles.searchIcon}
      />
      <Text style={styles.placeholder}>Search for a parking lot...</Text>
      <View style={styles.divider} />
      <Ionicons name="options-outline" size={18} color="#1a73e8" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: "#aaa",
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: "#eee",
    marginHorizontal: 10,
  },
});
