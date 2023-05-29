import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useDispatch, useSelector } from "react-redux";
import { playSound, stopSound } from "../actions";
import {
  Text,
  Button,
  TextInput,
  IconButton,
  Portal,
  Dialog,
} from "react-native-paper";
import Timer from "../Components/Timer";

const Record = (navigation) => {
  const [recording, setRecording] = useState();
  const [recordingName, setRecordingName] = useState("");
  const recordings = useSelector((state) => state.recordings);
  const sound = useSelector((state) => state.sound);
  const isRecording = useSelector((state) => state.isRecording);
  const serverAddress = useSelector((state) => state.serverAddress);
  const serverPort = useSelector((state) => state.serverPort);
  const [soundUri, setSoundUri] = useState("");
  const [saveAsModal, setSaveAsModal] = useState(false);
  const hideSaveAsModal = () => setSaveAsModal(false);
  const [reset, setReset] = useState(null);
  const [alertVisible, setAlertVisible] = useState(true);
  const hideAlert = () => setAlertVisible(false);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const hideIsSavingModal = () => setIsSavingModal(false);
  const isPlaying = useSelector((state) => state.isPlaying);
  const isPlayingArray = useSelector((state) => state.isPlayingArray);

  useEffect(() => {
    loadRecordings();
  }, []);

  const startRecording = async () => {
    // Clear the soundUri state
    dispatch(stopSound(sound));
    setSoundUri("");
    try {
      // Request audio recording permissions
      await Audio.requestPermissionsAsync();

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create a new audio recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Set the recording object in state
      setRecording(recording);

      // Update the recording status
      dispatch({ type: "SET_IS_RECORDING", payload: true });
    } catch (error) {
      console.log("startRecording error", error);
    }
  };

  async function stopRecording() {
    // Update the recording status
    dispatch({ type: "SET_IS_RECORDING", payload: false });

    // Stop and unload the recording
    await recording.stopAndUnloadAsync();

    // Set audio mode to disallow recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    // Get the URI of the recording
    const uri = recording.getURI();

    // Set the soundUri state with the recording URI
    setSoundUri(uri);

    console.log("Recording stopped and stored at", uri);
  }

  async function saveRecording() {
    try {
      // Check if the "recordings" directory exists, create it if it doesn't
      const dirInfo = await FileSystem.getInfoAsync(
        FileSystem.documentDirectory + "recordings/"
      );
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(
          FileSystem.documentDirectory + "recordings/",
          { intermediates: true }
        );
      }

      // Define the new path for the recording file
      const newPath =
        FileSystem.documentDirectory +
        "recordings/" +
        recordingName.replace(/\s+/g, "") +
        ".wav";

      // Move the recording file to the new path
      await FileSystem.moveAsync({
        from: soundUri,
        to: newPath,
      });

      // Load the updated list of recordings
      loadRecordings();

      // Reset states and modals
      setRecordingName("");
      setSoundUri("");
      setReset(true);
      setReset(null);
      setSaveAsModal(false);
      setIsSavingModal(true);
    } catch (error) {
      console.log("saveRecording erreur", error);
      alert(
        "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer."
      );
    }
  }

  const dispatch = useDispatch();

  const loadRecordings = async () => {
    try {
      // Check if the "recordings" directory exists
      const dirInfo = await FileSystem.getInfoAsync(
        FileSystem.documentDirectory + "recordings/"
      );
      if (dirInfo.exists) {
        // Read the files in the "recordings" directory
        const files = await FileSystem.readDirectoryAsync(
          FileSystem.documentDirectory + "recordings/"
        );

        // Retrieve information for each recording file
        const recordingsInfo = await Promise.all(
          files.map(async (file) => {
            const fileInfo = await FileSystem.getInfoAsync(
              FileSystem.documentDirectory + "recordings/" + file
            );
            return {
              name: file.split(".")[0],
              uri: fileInfo.uri,
            };
          })
        );

        // Update the recordings list
        dispatch({ type: "SET_RECORDINGS", payload: recordingsInfo });
      }
    } catch (error) {
      console.log("loadRecordings erreur", error);
    }
  };

  async function deleteRecording(uri) {
    try {
      // Delete the recording file using the provided URI
      await FileSystem.deleteAsync(uri);
      console.log("Recording deleted from", uri);
      // Load the updated list of recordings
      loadRecordings();
    } catch (error) {
      console.log("deleteRecording error", error);
      alert(
        "Une erreur est survenue lors de la suppression. Veuillez réessayer."
      );
    }
  }

  return (
    <View style={styles.container}>
      <Portal>
        <Dialog visible={alertVisible} onDismiss={hideAlert}>
          <Dialog.Title>Connexion réussie ✅</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tu es bien connecté au serveur :{"\n"}
              {`http://${serverAddress}:${serverPort}`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideAlert}>Ok 👌</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={saveAsModal} onDismiss={hideSaveAsModal}>
          <Dialog.Title>Nom de votre enregistrement :</Dialog.Title>
          <IconButton
            icon={"close"}
            iconColor="red"
            onPress={hideSaveAsModal}
            style={{ position: "absolute", right: 0 }}
          />
          <Dialog.Content>
            <TextInput
              style={styles.input}
              value={recordingName}
              onChangeText={setRecordingName}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              style={styles.item}
              icon="download"
              mode="contained"
              onPress={saveRecording}>
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={isSavingModal} onDismiss={hideIsSavingModal}>
          <Dialog.Title style={{ paddingVertical: 10 }}>
            Enregistrement réussi ✅
          </Dialog.Title>
          <Dialog.Actions
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
            }}>
            <Button onPress={hideIsSavingModal}>Ok 👌</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <View
        style={{
          width: "100%",
          marginBottom: 30,
          alignItems: "center",
        }}>
        <Text style={styles.title} variant="titleLarge">
          Enregistrez-vous maintenant 😉
        </Text>
        <Timer
          startTimer={{
            reset: reset ? reset : isRecording,
            start: isRecording,
          }}
        />
        <IconButton
          iconColor="red"
          mode="contained"
          icon={isRecording ? "stop" : "record"}
          onPress={isRecording ? stopRecording : startRecording}
        />
      </View>
      {soundUri && (
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title} variant="titleMedium">
            Magnifique voix 😉
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              icon={!isPlaying ? "play" : "stop"}
              onPressIn={() => {
                !isPlaying
                  ? dispatch(playSound(soundUri, sound))
                  : dispatch(stopSound(sound));
              }}>
              Écouter
            </Button>
            <Button
              mode="contained"
              icon="download"
              onPress={() => setSaveAsModal(true)}>
              Enregistrer
            </Button>
          </View>
        </View>
      )}
      <Text style={styles.title} variant="titleLarge">
        Mes enregistrements 🎤
      </Text>
      {!recordings.length ? (
        <Text style={styles.container} variant="bodyMedium">
          Pas de son enregistré 😭, enregistre toi juste en haut 😉.
        </Text>
      ) : (
        <FlatList
          data={recordings}
          renderItem={({ item, index }) => (
            <View
              style={styles.recordingItem}
              onPress={() => dispatch(playSound(item.uri, sound))}>
              <Text variant="titleMedium">{item.name}</Text>
              <View style={{ flexDirection: "row" }}>
                <IconButton
                  mode="contained"
                  size={18}
                  icon={!isPlayingArray[index] ? "play" : "stop"}
                  onPressIn={() => {
                    if (!isPlayingArray[index]) {
                      dispatch(playSound(item.uri, sound, index));
                    } else {
                      dispatch(stopSound(sound));
                    }
                  }}
                />

                <IconButton
                  mode="contained"
                  icon="delete"
                  iconColor="red"
                  size={18}
                  onPress={() => deleteRecording(item.uri)}
                />
              </View>
            </View>
          )}
          keyExtractor={(item) => item.uri}
        />
      )}
      <Button
        mode="contained"
        icon="arrow-right"
        onPress={() => {
          if (sound) {
            dispatch({
              type: "IS_PLAYING_ARRAY",
              payload: new Array(isPlayingArray.length).fill(false), //All to false,
            });
          }
          navigation.navigation.navigate("Modification");
        }}>
        Suivant
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: {
    padding: 10,
    color: "#663399",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginVertical: 20,
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  input: {
    margin: 10,
    width: 300,
  },
});

export default Record;
