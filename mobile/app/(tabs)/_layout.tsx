import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";
import Colors, { bellusGold, bellusDark } from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import i18n from "@/lib/i18n";

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{label}</Text>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerStyle: { backgroundColor: bellusDark },
        headerTintColor: bellusGold,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t("tabs.book"),
          tabBarIcon: ({ color }) => <TabIcon label={"\u{1F4C5}"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: i18n.t("tabs.explore"),
          tabBarIcon: ({ color }) => <TabIcon label={"\u{2728}"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: i18n.t("tabs.appointments"),
          tabBarIcon: ({ color }) => <TabIcon label={"\u{1F4CB}"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: i18n.t("tabs.profile"),
          tabBarIcon: ({ color }) => <TabIcon label={"\u{1F464}"} color={color} />,
        }}
      />
    </Tabs>
  );
}
