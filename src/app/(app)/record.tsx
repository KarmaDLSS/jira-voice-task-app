import React, { useState, useEffect } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../ctx/authcontext"; // Adjust path if needed

const encodeBasicAuth = (email: string, token: string) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const str = `${email}:${token}`;
  let output = "";
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = "="), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    block = (block << 8) | charCode;
  }
  return output;
};

// Pure JS Custom Dropdown Component to avoid Native crashes
const CustomSelector = ({
  label,
  items,
  selectedValue,
  onSelect,
  placeholder,
  isLoading,
}: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownSim}
        onPress={() => setModalVisible(true)}
        disabled={isLoading}
      >
        <Text style={selectedValue ? styles.inputTextDark : styles.inputText}>
          {isLoading ? "Loading..." : selectedValue?.name || placeholder}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#6B778C" />
        ) : (
          <FontAwesome5 name="caret-down" size={16} color="#6B778C" />
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select {label}</Text>
            <FlatList
              data={items}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function RecordScreen() {
  const { session } = useAuth();

  // Dynamic Jira Data State
  const [projects, setProjects] = useState<any[]>([]);
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form State
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio State
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // 1. Fetch Dynamic Data from Jira on Mount
  useEffect(() => {
    async function fetchJiraData() {
      if (!session) return;
      setIsLoadingData(true);

      const authHeader = `Basic ${encodeBasicAuth(session.email, session.apiToken)}`;
      const headers = { Authorization: authHeader, Accept: "application/json" };

      try {
        // Fetch Projects
        const projRes = await fetch(
          `https://${session.domain}/rest/api/3/project`,
          { headers },
        );
        const projData = await projRes.json();
        if (projRes.ok) setProjects(projData);

        // Fetch Issue Types
        const typeRes = await fetch(
          `https://${session.domain}/rest/api/3/issuetype`,
          { headers },
        );
        const typeData = await typeRes.json();
        // Filter out sub-tasks to keep it simple for now
        if (typeRes.ok) setIssueTypes(typeData.filter((t: any) => !t.subtask));
      } catch (error) {
        console.error("Failed to fetch Jira schema:", error);
        Alert.alert("Data Error", "Could not load projects from Jira.");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchJiraData();
  }, [session]);

  useEffect(() => {
    (async () => {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  const handleRecordPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  async function startRecording() {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission Denied", "Microphone access is required.");
        return;
      }
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setAudioUri(null);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      setAudioUri(audioRecorder.uri);
      console.log("Audio saved at:", audioRecorder.uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }

  const handleSubmit = async () => {
    if (!selectedProject || !selectedIssueType || !summary || !description) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
      return;
    }

    if (!session) {
      Alert.alert("Auth Error", "No active Jira session found.");
      return;
    }

    setIsSubmitting(true);

    try {
      const adfDescription = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ text: description, type: "text" }],
          },
        ],
      };

      const payload = {
        fields: {
          project: { id: selectedProject.id },
          summary: summary,
          description: adfDescription,
          issuetype: { id: selectedIssueType.id },
        },
      };

      const authHeader = `Basic ${encodeBasicAuth(session.email, session.apiToken)}`;
      const response = await fetch(
        `https://${session.domain}/rest/api/3/issue`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors?.project ||
            data.errorMessages?.[0] ||
            "Failed to create task",
        );
      }

      Alert.alert("Success", `Task created: ${data.key}`);
      setSummary("");
      setDescription("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image
              source={require("../../../assets/images/splashscreen.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Create Task</Text>
        </View>

        {/* Dynamic Project Dropdown */}
        <CustomSelector
          label="project*"
          items={projects}
          selectedValue={selectedProject}
          onSelect={setSelectedProject}
          placeholder="Select a project"
          isLoading={isLoadingData}
        />

        {/* Dynamic Issue Type Dropdown */}
        <CustomSelector
          label="issue type*"
          items={issueTypes}
          selectedValue={selectedIssueType}
          onSelect={setSelectedIssueType}
          placeholder="Select issue type"
          isLoading={isLoadingData}
        />

        {/* Summary */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>summary title*</Text>
          <TextInput
            style={styles.input}
            placeholder="login issue on checkout"
            placeholderTextColor="#A5ADBA"
            value={summary}
            onChangeText={setSummary}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>description*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="users are unable to login..."
            placeholderTextColor="#A5ADBA"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* Voice to Text Button */}
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          onPress={handleRecordPress}
        >
          <Text style={styles.voiceButtonText}>
            Voice To Text{" "}
            <Text style={styles.voiceButtonSubtext}>
              {isRecording ? "recording..." : "tap mic to record"}
            </Text>
          </Text>
          <FontAwesome5
            name="microphone"
            size={24}
            color={isRecording ? "#FF5630" : "#0052CC"}
          />
        </TouchableOpacity>

        {/* Priority (Static for now as priority API is complex and often project-specific) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>priority*</Text>
          <View style={styles.dropdownSim}>
            <Text style={styles.inputTextDark}>{priority}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Task</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F5F7" },
  container: { padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  logoPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  logoText: {
    color: "#0052CC",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#0052CC" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: "#0052CC", marginBottom: 8, fontWeight: "500" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#172B4D",
  },
  dropdownSim: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: { fontSize: 14, color: "#A5ADBA" },
  inputTextDark: { fontSize: 14, color: "#172B4D" },
  textArea: { height: 100 },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  voiceButtonActive: { borderColor: "#FF5630", backgroundColor: "#FFF0ED" },
  voiceButtonText: { fontSize: 14, color: "#172B4D", fontWeight: "500" },
  voiceButtonSubtext: { color: "#A5ADBA", fontWeight: "normal" },
  submitButton: {
    backgroundColor: "#0052CC",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "center",
  },
  submitButtonDisabled: { backgroundColor: "#A5ADBA" },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(9, 30, 66, 0.54)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    padding: 20,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#172B4D",
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EBECF0",
  },
  modalItemText: { fontSize: 16, color: "#172B4D" },
  modalCloseBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F4F5F7",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: { color: "#42526E", fontWeight: "bold" },
});
