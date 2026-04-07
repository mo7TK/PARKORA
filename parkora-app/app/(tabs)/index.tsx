import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ParkingPin from "@/src/components/ParkingPin";
import ParkingCard from "@/src/components/ParkingCard";
import SearchBar from "@/src/components/SearchBar";
import { PARKING_LOT } from "@/src/constants/config";

// ── Sheet configuration ───────────────────────────────────────────────────────
const SHEET_HEIGHT = 170; // total height of the sheet in pixels
const DRAG_THRESHOLD = 60; // how many px the user must drag before it snaps away
// ─────────────────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(true);

  /*
    translateY = 0           → sheet fully visible at bottom
    translateY = SHEET_HEIGHT → sheet completely hidden below screen
    We start at SHEET_HEIGHT and animate to 0 on mount (slide-up effect).
    useNativeDriver:true works because we are only animating `transform`.
  */
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Slide up on mount
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  function showSheet() {
    setSheetVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }

  function hideSheet() {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  }

  /*
    PanResponder attached to the drag handle only.
    - While dragging: move the sheet in real time (clamp to 0 so it can't go above rest)
    - On release: if dragged more than DRAG_THRESHOLD → hide, otherwise snap back
  */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        const next = Math.max(0, g.dy); // can't drag upward past resting point
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DRAG_THRESHOLD) {
          hideSheet();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  async function goToMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError("Location permission denied");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      800,
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Fullscreen map ──────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: PARKING_LOT.latitude,
          longitude: PARKING_LOT.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={{
            latitude: PARKING_LOT.latitude,
            longitude: PARKING_LOT.longitude,
          }}
          onPress={() => router.push("/details")}
        >
          <ParkingPin />
        </Marker>
      </MapView>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <SearchBar />

      {/* ── Location error ────────────────────────────────────────────────────── */}
      {locationError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}

      {/*
        ── Locate button ─────────────────────────────────────────────────────
        Positioned on the right, just above the bottom sheet.
        bottom = SHEET_HEIGHT + 12px gap
      */}
      <TouchableOpacity style={styles.locationButton} onPress={goToMyLocation}>
        <Ionicons name="locate" size={22} color="#1a73e8" />
      </TouchableOpacity>

      {/* Re-open button shown only when sheet is hidden */}
      {!sheetVisible && (
        <TouchableOpacity style={styles.reopenButton} onPress={showSheet}>
          <Ionicons name="chevron-up" size={20} color="#1a73e8" />
        </TouchableOpacity>
      )}

      {/* ── Animated bottom sheet ────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
      >
        {/* Drag handle — touch events handled by PanResponder */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.sheetHandle} />
        </View>

        <Text style={styles.sheetTitle}>Nearby Parking</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          <ParkingCard
            name={PARKING_LOT.name}
            totalSpots={PARKING_LOT.totalSpots}
            onPress={() => router.push("/details")}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // ── Locate button — right side, just above the sheet ─────────────────────
  locationButton: {
    position: "absolute",
    bottom: SHEET_HEIGHT + 12,
    right: 16,
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Reopen button — shown when sheet is dragged away ─────────────────────
  reopenButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Error banner ───────────────────────────────────────────────────────────
  errorBanner: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 13,
  },

  // ── Bottom sheet ───────────────────────────────────────────────────────────
  // Fixed height + bottom:0 + translateY is the reliable animation pattern.
  // translateY:0 = visible, translateY:SHEET_HEIGHT = hidden below screen.
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
  },

  // Larger touch target for the drag handle
  dragArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
  },

  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 8,
  },
});
