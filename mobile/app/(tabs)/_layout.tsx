import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { bellusGold, bellusDark } from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import i18n from "@/lib/i18n";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
  color,
}: {
  name: IoniconName;
  focused: boolean;
  color: string;
}) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: bellusGold,
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#ede8e3",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
        headerStyle: { backgroundColor: bellusDark },
        headerTintColor: bellusGold,
        headerTitleStyle: { fontWeight: "700", letterSpacing: 1.5, fontSize: 15 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t("tabs.book"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: i18n.t("tabs.explore"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "images" : "images-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: i18n.t("tabs.appointments"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "time" : "time-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: i18n.t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
