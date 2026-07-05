import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
// The new modular imports
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";

export default function RecordScreen() {
  // 1. Hook-based recorder instantiation
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // 2. Global Audio Mode Configuration
  useEffect(() => {
    (async () => {
      // This ensures iOS doesn't record dead air if the hardware switch is on silent
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  async function startRecording() {
    try {
      // 3. Strict Permission Check via AudioModule
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert(
          "Permission Denied",
          "You must allow microphone access to record tasks.",
        );
        return;
      }

      // 4. Prepare the buffer and start
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
      setAudioUri(null); // Clear previous runs
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start the microphone.");
    }
  }

  async function stopRecording() {
    if (!isRecording) return;

    try {
      // 5. Stop and extract the file path
      await audioRecorder.stop();
      setIsRecording(false);

      // In the new API, the URI is directly accessible on the recorder object
      const uri = audioRecorder.uri;
      setAudioUri(uri);

      console.log("Recording stopped and stored at", uri);

      // -> HERE IS WHERE THE TRANSCRIPTION PIPELINE BEGINS
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Input</Text>

      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording ? styles.recordingActive : null,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      {audioUri && (
        <Text style={styles.uriText}>
          File saved at: {audioUri.split("/").pop()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#172B4D",
  },
  recordButton: {
    backgroundColor: "#0052CC",
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  recordingActive: {
    backgroundColor: "#FF5630",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  uriText: {
    marginTop: 30,
    fontSize: 12,
    color: "#6B778C",
    textAlign: "center",
  },
});
