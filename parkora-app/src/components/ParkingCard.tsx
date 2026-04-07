import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BACKEND_URL } from "@/src/constants/config";

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  name: string;
  totalSpots: number;
  onPress: () => void;
};

type Summary = {
  free: number;
  occupied: number;
  total: number;
};
// ─────────────────────────────────────────────────────────────────────────────

export default function ParkingCard({ name, totalSpots, onPress }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    // Same HTTP GET used in details.tsx — one request on mount, no WebSocket needed
    fetch(`${BACKEND_URL}/spots-summary`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  }, []);

  const isNoSpotsAvailable = summary?.free === 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>P</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>

        {/* Spots availability — shows free/total once loaded */}
        {summary ? (
          <Text style={styles.spots}>
            <Text
              style={
                (styles.spotsNumber,
                isNoSpotsAvailable && styles.spotsNumberRed)
              }
            >
              {summary.free}
            </Text>
            <Text style={styles.spotsSlash}> / {totalSpots} </Text>
            <Text style={styles.spotsLabel}>spots free</Text>
          </Text>
        ) : (
          <ActivityIndicator
            size="small"
            color="#1a73e8"
            style={styles.loader}
          />
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#aaa" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    width: 220, // fixed width so cards don't stretch in horizontal scroll
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 3,
  },
  spots: {
    fontSize: 13,
  },
  spotsNumber: {
    color: "#2ecc71",
    fontWeight: "700",
  },
  spotsNumberRed: {
    color: "#e74c3c",
  },
  spotsSlash: {
    color: "#aaa",
  },
  spotsLabel: {
    color: "#aaa",
  },
  loader: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
});
