import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
export default function RecordScreen() {
  const [session, setSession] = useState<{
    domain: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the saved credentials from SecureStore
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = await SecureStore.getItemAsync("jira_session");
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        } else {
          // If no session exists, boot them back to the login screen
          router.replace("/record");
        }
      } catch (error) {
        console.error("Session load error:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("jira_session");
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0052CC" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jira Voice</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Authentication Successful.</Text>
        {session && (
          <Text style={styles.subText}>
            Connected as: {session.email}
            {"\n"}
            Workspace: {session.domain}
          </Text>
        )}

        {/* Recording UI Placeholder */}
        <View style={styles.recordPlaceholder}>
          <Text style={styles.placeholderText}>
            Voice Recording UI goes here
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DFE1E6",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#172B4D",
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: "#DE350B",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00875A", // Jira Success Green
    marginBottom: 12,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    color: "#5E6C84",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  recordPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5, // For Android shadow
  },
  placeholderText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
});
