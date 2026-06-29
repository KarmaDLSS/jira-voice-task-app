import { useState } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const handleConnect = () => {
    // You will implement the Jira API authentication logic here
    console.log("Connecting to:", domain, "with", email);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* 1. Header Section */}
        <View style={styles.headerContainer}>
          {/* Replace with your actual logo path */}
          <Image
            source={require("../../assets/images/splashscreen.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Connect your Jira Account</Text>
        </View>

        {/* 2. Input Section */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Jira Domain</Text>
          <TextInput
            style={styles.input}
            placeholder="your-domain.atlassian.net"
            value={domain}
            onChangeText={setDomain}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>API Token</Text>
          <TextInput
            style={styles.input}
            placeholder="*******************"
            value={token}
            onChangeText={setToken}
            secureTextEntry={true} // Obscures the token
          />
        </View>

        {/* 3. Action Section */}
        <TouchableOpacity style={styles.button} onPress={handleConnect}>
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Light grey background from wireframe
    padding: 24,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#172B4D", // Jira brand dark blue
  },
  formContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: "#0052CC", // Jira brand blue
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
});
