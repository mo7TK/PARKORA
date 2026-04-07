import { StyleSheet, Text, View } from "react-native";

type Props = {
  id:     number;
  status: "free" | "occupied";
};

export default function SpotBox({ id, status }: Props) {
  const isFree = status === "free";
  return (
    <View style={[styles.spot, isFree ? styles.free : styles.occupied]}>
      <Text style={styles.number}>{id}</Text>
      <Text style={styles.label}>{isFree ? "Free" : "Occupied"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spot: {
    height:         100,
    width:          "30%",
    margin:         6,
    borderRadius:   10,
    justifyContent: "center",
    alignItems:     "center",
  },
  free: {
    backgroundColor: "#2ecc71",
  },
  occupied: {
    backgroundColor: "#e74c3c",
  },
  number: {
    fontSize:   22,
    fontWeight: "700",
    color:      "#fff",
  },
  label: {
    fontSize:  11,
    color:     "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
});
