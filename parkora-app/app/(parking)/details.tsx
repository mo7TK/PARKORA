import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { BACKEND_URL, PARKING_LOT } from "@/src/constants/config";

// ── Types ─────────────────────────────────────────────────────────────────────
type Summary = {
  total: number;
  free: number;
  occupied: number;
};
// ─────────────────────────────────────────────────────────────────────────────

export default function Details() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/spots-summary`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  }, []);

  function handleNavigate() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${PARKING_LOT.latitude},${PARKING_LOT.longitude}`;
    Linking.openURL(url);
  }

  function handleViewLayout() {
    router.push("/minimap");
  }

  return (
    /*
      ScrollView wraps everything so the content below the hero image
      can scroll on small screens.
    */
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ── Hero image ──────────────────────────────────────────────────────── */}
      {/*
        The hero is a fixed-height block.
        The Image fills it completely.
        LinearGradient sits on top of the image (absolute) and fades from
        transparent at the top to a dark color at the bottom so the
        parking name text is always readable.
      */}
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/parking_entrance.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.72)"]}
          style={styles.heroGradient}
        >
          <Text style={styles.heroName}>{PARKING_LOT.name}</Text>
          <Text style={styles.heroSubtitle}>
            Tap navigate to get directions to the entrance
          </Text>
        </LinearGradient>
      </View>

      {/* ── Stats card ──────────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{PARKING_LOT.totalSpots}</Text>
            <Text style={styles.statLabel}>Total spots</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            {summary ? (
              <Text style={[styles.statNumber, styles.statNumberFree]}>
                {summary.free}
              </Text>
            ) : (
              <ActivityIndicator size="large" style={{ marginBottom: 8 }} />
            )}
            <Text style={styles.statLabel}>Available</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            {summary ? (
              <Text style={[styles.statNumber, styles.statNumberOccupied]}>
                {summary.occupied}
              </Text>
            ) : (
              <ActivityIndicator size="large" style={{ marginBottom: 8 }} />
            )}
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
        </View>
      </View>

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.buttonNavigate} onPress={handleNavigate}>
        <Text style={styles.buttonTextWhite}>Navigate to Parking</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonLayout} onPress={handleViewLayout}>
        <Text style={styles.buttonTextDark}>View Parking Layout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  content: {
    paddingBottom: 40,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    width: "100%",
    height: 260,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  /*
    LinearGradient is position:absolute so it overlays the image.
    It starts at 60% down the image (transparent) and reaches full
    opacity at the very bottom — giving a natural fade-to-dark effect.
  */
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
  },

  // ── Stats card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2e1a1a",
  },
  statNumberFree: {
    color: "#2ecc71",
  },
  statNumberOccupied: {
    color: "#bc1300",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  buttonNavigate: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  buttonLayout: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonTextWhite: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonTextDark: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
});
