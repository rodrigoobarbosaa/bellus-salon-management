import React from "react";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import Colors, { bellusGold, bellusDark } from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import i18n from "@/lib/i18n";

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
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: i18n.t("tabs.appointments"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "list.bullet", android: "list", web: "list" }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: i18n.t("tabs.profile"),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "person", android: "person", web: "person" }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
