import { router } from "expo-router";
import { Redirect } from "expo-router";
import { useAuth } from "../ctx/authcontext";
// @ts-ignore
import { encode } from "base-64";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function LoginScreen() {
  // State variables for the inputs
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const { session, signIn } = useAuth();
  if (session) {
    return <Redirect href="/(app)/record" />;
  }
  // The connection and validation logic
  const handleConnect = async () => {
    // 1. Validation
    if (!domain || !email || !token) {
      Alert.alert("Error", "Fields cannot be empty.");
      return;
    }

    // 2. Auth Header Generation
    const authHeader = "Basic " + encode(`${email.trim()}:${token.trim()}`);
    const cleanDomain = domain.trim().replace(/\/$/, "");

    try {
      // 3. Verification Ping to Jira
      const response = await fetch(`https://${cleanDomain}/rest/api/3/myself`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        await SecureStore.setItemAsync(
          "jira_session",
          JSON.stringify({
            domain: cleanDomain,
            email: email.trim(),
            apiToken: token.trim(),
          }),
        );
        await signIn({
          domain: cleanDomain,
          email: email.trim(),
          apiToken: token.trim(),
        });
      } else {
        Alert.alert("Authentication Failed", "Invalid credentials or domain.");
      }
    } catch (error) {
      Alert.alert(
        "Network Error",
        "Could not connect to Jira. Check your internet and domain name.",
      );
    }
  };

  // The UI Rendering
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.logoPlaceholder}>
          <Image
            source={require("../../assets/images/splashscreen.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Connect your Jira Account</Text>
      </View>

      {/* Input Section */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Jira Domain</Text>
        <TextInput
          style={styles.input}
          placeholder="your-domain.atlassian.net"
          value={domain}
          onChangeText={setDomain}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>API Token</Text>
        <TextInput
          style={styles.input}
          placeholder="*******************"
          value={token}
          onChangeText={setToken}
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Action Section */}
      <TouchableOpacity style={styles.button} onPress={handleConnect}>
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 24,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#0052CC",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#172B4D",
  },
  formContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: "#0052CC",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0052CC",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
});
