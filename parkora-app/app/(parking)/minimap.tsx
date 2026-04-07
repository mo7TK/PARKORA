import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { WS_URL } from "@/src/constants/config";

// ── Types ─────────────────────────────────────────────────────────────────────
type Spot = { id: number; status: "free" | "occupied" };
type ConnectionStatus = "connecting" | "connected" | "disconnected";
// ─────────────────────────────────────────────────────────────────────────────

/*
  ── Spot positions ─────────────────────────────────────────────────────────────
  Each value is a percentage of the image width (x) and height (y).
  0% = top-left corner, 100% = bottom-right corner.

  If a spot indicator looks off, just tweak the x/y value here.
  No other part of the code needs to change.

  Layout from the image:
    Spots  1–9  → right column, numbered bottom to top
    Spots 10–14 → top row, numbered right to left
*/
const SPOT_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 68, y: 61.9 },
  2: { x: 70, y: 56.9 },
  3: { x: 72, y: 51.7 },
  4: { x: 74, y: 46.5 },
  5: { x: 76, y: 41.3 },
  6: { x: 78, y: 36.1 },
  7: { x: 80, y: 30.8 },
  8: { x: 82, y: 25.6 },
  9: { x: 84, y: 20.4 },
  10: { x: 61.4, y: 9.6 },
  11: { x: 51.4, y: 8.2 },
  12: { x: 40.9, y: 6.8 },
  13: { x: 30.1, y: 5.3 },
  14: { x: 19.6, y: 4 },
};

const IMAGE_NATURAL_WIDTH = 735;
const IMAGE_NATURAL_HEIGHT = 1305;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const IMAGE_DISPLAY_WIDTH = SCREEN_WIDTH;
const IMAGE_DISPLAY_HEIGHT =
  (IMAGE_NATURAL_HEIGHT / IMAGE_NATURAL_WIDTH) * IMAGE_DISPLAY_WIDTH;

const DOT_SIZE = 28;

export default function MiniMap() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  // ── Reanimated shared values ────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ── Pinch gesture (zoom) ────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // ── Pan gesture (drag) ──────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ── Reset view ──────────────────────────────────────────────────────────────
  function resetView() {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }

  // ── WebSocket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    function connect() {
      setConnectionStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnectionStatus("connected");
      ws.onmessage = (e) => setSpots(JSON.parse(e.data).spots);
      ws.onclose = () => {
        setConnectionStatus("disconnected");
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => wsRef.current?.close();
  }, []);

  const statusColor = {
    connecting: "#f0a500",
    connected: "#2ecc71",
    disconnected: "#e74c3c",
  }[connectionStatus];

  const freeCount = spots.filter((s) => s.status === "free").length;
  const occupiedCount = spots.filter((s) => s.status === "occupied").length;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ── Full screen map ─────────────────────────────────────────────────── */}
      {/*
        mapClip fills the entire screen.
        overflow:hidden ensures the image doesn't bleed outside when zoomed.
      */}
      <View style={styles.mapClip}>
        <GestureDetector gesture={composedGesture}>
          {/*
            Single Animated.View that receives pan + zoom transforms.
            Both the image and the spot overlays live inside it so
            they move and scale together as one unit.
          */}
          <Animated.View
            style={[
              { width: IMAGE_DISPLAY_WIDTH, height: IMAGE_DISPLAY_HEIGHT },
              animatedStyle,
            ]}
          >
            <Image
              source={require("@/assets/images/parking_map.png")}
              style={{
                width: IMAGE_DISPLAY_WIDTH,
                height: IMAGE_DISPLAY_HEIGHT,
              }}
              resizeMode="cover"
            />

            {spots.map((spot) => {
              const pos = SPOT_POSITIONS[spot.id];
              if (!pos) return null;

              const left = (pos.x / 100) * IMAGE_DISPLAY_WIDTH - DOT_SIZE / 2;
              const top = (pos.y / 100) * IMAGE_DISPLAY_HEIGHT - DOT_SIZE / 2;

              return (
                <View
                  key={spot.id}
                  style={[
                    styles.spotDot,
                    {
                      left,
                      top,
                      backgroundColor:
                        spot.status === "free" ? "#2ecc71" : "#e74c3c",
                    },
                  ]}
                >
                  <Text style={styles.spotDotText}>{spot.id}</Text>
                </View>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* ── Floating top overlay: connection status + free/occupied counts ─── */}
      {/*
        position:absolute + top:60 places this pill just below the
        native navigation header that expo-router renders for this screen.
        It floats above the map without pushing any layout.
      */}
      <View style={styles.topOverlay}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>

        {spots.length > 0 && (
          <>
            <View style={styles.separator} />
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, styles.dotFree]} />
              <Text style={styles.summaryText}>Free: {freeCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, styles.dotOccupied]} />
              <Text style={styles.summaryText}>Occupied: {occupiedCount}</Text>
            </View>
          </>
        )}
      </View>

      {/* ── Waiting state ──────────────────────────────────────────────────── */}
      {spots.length === 0 && (
        <View style={styles.waiting}>
          <Text style={styles.waitingText}>
            Waiting for detection data...{"\n"}Make sure detect.py is running.
          </Text>
        </View>
      )}

      {/* ── Reset View floating button ─────────────────────────────────────── */}
      <TouchableOpacity style={styles.resetButton} onPress={resetView}>
        <Text style={styles.resetButtonText}>⊙ Reset View</Text>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Map (full screen) ─────────────────────────────────────────────────────
  mapClip: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },

  // ── Spot indicator dot ────────────────────────────────────────────────────
  spotDot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 6,
  },
  spotDotText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Top floating pill ─────────────────────────────────────────────────────
  topOverlay: {
    position: "absolute",
    top: 30,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    color: "#fff",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  // thin vertical line between the status and the counts
  separator: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  dotFree: { backgroundColor: "#2ecc71" },
  dotOccupied: { backgroundColor: "#e74c3c" },
  summaryText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },

  // ── Waiting state ─────────────────────────────────────────────────────────
  waiting: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  waitingText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // ── Reset button ──────────────────────────────────────────────────────────
  resetButton: {
    position: "absolute",
    bottom: 45,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a73e8",
  },
});
