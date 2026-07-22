import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from 'expo-file-system';
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../ctx/authcontext"; // Adjust path if needed
import { JiraProject } from "@/interfaces/MyProjects";
// @ts-ignore
import { encode } from "base-64";


// Pure JS Custom Dropdown Component to avoid Native crashes
const CustomSelector = ({
  label,
  items,
  selectedValue,
  onSelect,
  placeholder,
  isLoading,
  authHeader,
}: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  const getIconUrl = (item: any) => {
    if (!item) return null;
    if (item.avatarUrls?.["24x24"]) return item.avatarUrls["24x24"];
    if (item.avatarUrls?.["32x32"]) return item.avatarUrls["32x32"];
    if (item.avatarUrls?.["48x48"]) return item.avatarUrls["48x48"];
    if (item.iconUrl) return item.iconUrl;
    return null;
  };

  const renderIcon = (item: any, style: any) => {
    const iconUrl = getIconUrl(item);
    if (!iconUrl) return null;
    return (
      <Image
        source={{
          uri: iconUrl,
          headers: authHeader ? { Authorization: authHeader } : undefined,
        }}
        style={style}
        contentFit="cover"
      />
    );
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownSim}
        onPress={() => setModalVisible(true)}
        disabled={isLoading}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {!isLoading && selectedValue && renderIcon(selectedValue, { width: 20, height: 20, marginRight: 8, borderRadius: 4 })}
          <Text style={selectedValue ? styles.inputTextDark : styles.inputText}>
            {isLoading ? "Loading..." : selectedValue?.name || placeholder}
          </Text>
        </View>
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {renderIcon(item, { width: 24, height: 24, marginRight: 12, borderRadius: 4 })}
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </View>
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
  const { session, signOut } = useAuth();

  const authHeader = session ? `Basic ${encode(`${session.email}:${session.apiToken}`)}` : undefined;

  // Dynamic Jira Data State
  const [projects, setProjects] = useState<JiraProject[]>([]);
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
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // 1. Fetch Dynamic Data from Jira on Mount
  useEffect(() => {
    async function fetchJiraData() {
      if (!session) return;
      setIsLoadingData(true);

      const headers = { Authorization: authHeader!, Accept: "application/json" };

      try {
        // Fetch Projects
        const projRes = await fetch(
          `https://${session.domain}/rest/api/3/project`,
          { headers },
        );
        const projData = await projRes.json();
        if (projRes.ok) {
          setProjects(projData);
        } else {
          console.error("Failed to fetch Jira projects:", projRes.status, projData);
          Alert.alert(
            "Data Error",
            `Could not load projects from Jira: ${projData.errorMessages?.[0] || projData.message || "Status " + projRes.status}`
          );
        }

        // Fetch Issue Types
        const typeRes = await fetch(
          `https://${session.domain}/rest/api/3/issuetype`,
          { headers },
        );
        const typeData = await typeRes.json();
        // Filter out sub-tasks to keep it simple for now
        if (typeRes.ok) {
          const filtered = typeData.filter((t: any) => !t.subtask);
          // Deduplicate by name to prevent showing multiples of "Story", "Task", etc.
          const uniqueTypes = filtered.filter((t: any, index: number, self: any[]) =>
            index === self.findIndex((type) => type.name === t.name)
          );
          setIssueTypes(uniqueTypes);
        } else {
          console.error("Failed to fetch Jira issue types:", typeRes.status, typeData);
          Alert.alert(
            "Data Error",
            `Could not load issue types from Jira: ${typeData.errorMessages?.[0] || typeData.message || "Status " + typeRes.status}`
          );
        }
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
      const uri = audioRecorder.uri;
      setAudioUri(uri);
      console.log("Audio saved at:", uri);
      if (uri) {
        processVoiceCommand(uri);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }

  async function processVoiceCommand(uri: string) {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      Alert.alert("Missing API Key", "EXPO_PUBLIC_GROQ_API_KEY is not set.");
      return;
    }

    setIsProcessingVoice(true);
    try {
      const file = new FileSystem.File(uri);
      const whisperRes = await file.upload(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          fieldName: "file",
          mimeType: "audio/m4a",
          httpMethod: "POST",
          uploadType: FileSystem.UploadType.MULTIPART,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          parameters: {
            model: "whisper-large-v3-turbo",
            language: "en",
            temperature: "0",
          },
        }
      );

      if (whisperRes.status !== 200) {
        let errMessage = "Whisper API failed";
        try {
          const errData = JSON.parse(whisperRes.body);
          errMessage = errData.error?.message || errMessage;
        } catch (e) { }
        throw new Error(errMessage);
      }

      const whisperData = JSON.parse(whisperRes.body);
      const transcript = whisperData.text;
      console.log("Transcript:", transcript);

      if (!transcript) {
        throw new Error("No transcription received.");
      }

      const projectNames = projects.map((p) => p.name).join(", ");
      const issueTypeNames = issueTypes.map((t) => t.name).join(", ");

      const prompt = `
      You are a Jira assistant. Extract the following information from the transcript to create a Jira issue.
      
      Available Projects: [${projectNames}]
      Available Issue Types: [${issueTypeNames}]
      
      Transcript: "${transcript}"
      
      Return a JSON object with EXACTLY these keys:
      - projectName: Best match from Available Projects (null if none match)
      - issueTypeName: Best match from Available Issue Types (null if none match)
      - title: A concise summary/title for the issue
      - description: The full detailed description
      
      Output ONLY valid JSON, no markdown formatting.
      `;

      const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });

      if (!chatRes.ok) {
        const errData = await chatRes.json();
        throw new Error(errData.error?.message || "Chat API failed");
      }

      const chatData = await chatRes.json();
      const resultJson = JSON.parse(chatData.choices[0].message.content);
      console.log("Parsed result:", resultJson);

      if (resultJson.projectName) {
        const matchedProject = projects.find(
          (p) => p.name.toLowerCase() === resultJson.projectName.toLowerCase()
        );
        if (matchedProject) setSelectedProject(matchedProject);
      }

      if (resultJson.issueTypeName) {
        const matchedType = issueTypes.find(
          (t) => t.name.toLowerCase() === resultJson.issueTypeName.toLowerCase()
        );
        if (matchedType) setSelectedIssueType(matchedType);
      }

      if (resultJson.title) setSummary(resultJson.title);
      if (resultJson.description) setDescription(resultJson.description);

    } catch (error: any) {
      console.error("Voice processing error:", error);
      Alert.alert("Voice Processing Failed", error.message);
    } finally {
      setIsProcessingVoice(false);
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

      const response = await fetch(
        `https://${session.domain}/rest/api/3/issue`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader!,
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.logo}>
              <Image
                source={require("../../../assets/images/splashscreen.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.headerTitle}>Create Task:</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={{ padding: 8 }}>
            <FontAwesome5 name="sign-out-alt" size={24} color="#0052CC" />
          </TouchableOpacity>
        </View>

        {/* Dynamic Project Dropdown */}
        <CustomSelector
          label="Project:"
          items={projects}
          selectedValue={selectedProject}
          onSelect={setSelectedProject}
          placeholder="Select a project"
          isLoading={isLoadingData}
          authHeader={authHeader}
        />

        {/* Dynamic Issue Type Dropdown */}
        <CustomSelector
          label="Issue Type:"
          items={issueTypes}
          selectedValue={selectedIssueType}
          onSelect={setSelectedIssueType}
          placeholder="Select issue type"
          isLoading={isLoadingData}
          authHeader={authHeader}
        />

        {/* Summary */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Summary Title:</Text>
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
          <Text style={styles.label}>Description:</Text>
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
          style={[
            styles.voiceButton,
            isRecording && styles.voiceButtonActive,
            isProcessingVoice && { opacity: 0.7 }
          ]}
          onPress={handleRecordPress}
          disabled={isProcessingVoice}
        >
          <Text style={styles.voiceButtonText}>
            Voice To Text{" "}
            <Text style={styles.voiceButtonSubtext}>
              {isProcessingVoice
                ? "processing..."
                : isRecording
                  ? "recording..."
                  : "tap mic to record"}
            </Text>
          </Text>
          {isProcessingVoice ? (
            <ActivityIndicator size="small" color="#0052CC" />
          ) : (
            <FontAwesome5
              name="microphone"
              size={24}
              color={isRecording ? "#FF5630" : "#0052CC"}
            />
          )}
        </TouchableOpacity>

        {/* Priority (Static for now as priority API is complex and often project-specific) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority:</Text>
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
    justifyContent: "space-between",
    marginBottom: 32,
    marginTop: 16,
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
