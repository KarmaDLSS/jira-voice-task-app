import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0052CC' }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="record" 
        options={{ 
          title: "tasks",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-cog" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: "settings",
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
