import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router, useSegments } from "expo-router";

// 1. Define the actual Atlassian Session structure
export interface JiraSession {
  domain: string;
  email: string;
  apiToken: string;
}

interface AuthState {
  session: JiraSession | null;
  isLoading: boolean;
  signIn: (sessionData: JiraSession) => Promise<void>;
  signOut: () => Promise<void>;
}

// 2. Create the Context
const AuthContext = createContext<AuthState>({
  session: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

// 3. Custom Hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}

// Configuration: 30 minutes in milliseconds
const AUTO_LOGOUT_THRESHOLD = 30 * 60 * 1000;

// 4. The Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<JiraSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  // Boot up: Check SecureStore for the Jira credentials
  useEffect(() => {
    async function loadSession() {
      try {
        const storedSession = await SecureStore.getItemAsync("jira_session");
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        }
      } catch (error) {
        console.error("Failed to load Jira session", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // Auto-Logout Logic via AppState
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        // Stamp the time they left the app
        await SecureStore.setItemAsync(
          "last_active_time",
          Date.now().toString(),
        );
      } else if (nextAppState === "active") {
        // Check how long they were gone
        const lastActive = await SecureStore.getItemAsync("last_active_time");
        if (lastActive) {
          const timeAway = Date.now() - parseInt(lastActive, 10);

          if (timeAway > AUTO_LOGOUT_THRESHOLD) {
            console.log("Session expired due to inactivity. Logging out.");
            await SecureStore.deleteItemAsync("jira_session");
            await SecureStore.deleteItemAsync("last_active_time");
            setSession(null);
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Router Guard: Reacts to state changes and protects routes
  useEffect(() => {
    if (isLoading) return;

    // Check if the user is inside the (app) group
    const inAuthGroup = segments[0] === "(app)";

    if (!session && inAuthGroup) {
      // No session, but trying to access the app? Kick them to login.
      router.replace("/");
    } else if (session && !inAuthGroup) {
      // Has session, but sitting on the login screen? Push them inside.
      router.replace("/(app)/record");
    }
  }, [session, segments, isLoading]);

  // Login Action
  const signIn = async (sessionData: JiraSession) => {
    await SecureStore.setItemAsync("jira_session", JSON.stringify(sessionData));
    await SecureStore.setItemAsync("last_active_time", Date.now().toString());
    setSession(sessionData);
  };

  // Logout Action
  const signOut = async () => {
    await SecureStore.deleteItemAsync("jira_session");
    await SecureStore.deleteItemAsync("last_active_time");
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
