import { View, Text, Pressable, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, ReorderInput } from "@trip-itinerary/core";

export function ItineraryView({ trip, onReorder }: { trip: Trip; onReorder?: (mv: ReorderInput) => void }) {
  return (
    <View style={{ marginTop: tokens.space.lg }}>
      <Text style={styles.h2}>{trip.preferences.destinations.join(", ")} · {trip.days.length} days</Text>
      {trip.days.map((day) => (
        <View key={day.id} style={{ marginTop: tokens.space.md }}>
          <Text style={styles.day}>Day {day.order}</Text>
          {day.items.map((item, index) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.time}>{item.time}</Text>
              <Text style={styles.title}>{item.title}</Text>
              {onReorder && index > 0 ? (
                <Pressable onPress={() => onReorder({ fromDay: day.order, fromIndex: index, toDay: day.order, toIndex: index - 1 })}>
                  <Text style={styles.move}>↑</Text>
                </Pressable>
              ) : null}
              {onReorder && index < day.items.length - 1 ? (
                <Pressable onPress={() => onReorder({ fromDay: day.order, fromIndex: index, toDay: day.order, toIndex: index + 1 })}>
                  <Text style={styles.move}>↓</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  h2: { color: tokens.color.navy, fontSize: tokens.font.h2, fontWeight: "700" },
  day: { color: tokens.color.blue, fontWeight: "700", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#EEF2F8" },
  time: { color: tokens.color.mid, width: 52, fontSize: 13 },
  title: { flex: 1, color: tokens.color.text },
  move: { color: tokens.color.blue, fontSize: 18, paddingHorizontal: 6, fontWeight: "700" },
});
