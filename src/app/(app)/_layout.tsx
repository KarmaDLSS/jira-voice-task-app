import { Tabs } from "expo-router";
import AppTabs from "@/components/app-tabs";

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="record" options={{ title: "Voice Input" }} />
      <Tabs.Screen name="explore" options={{ title: "Tasks" }} />
    </Tabs>
  );
}
