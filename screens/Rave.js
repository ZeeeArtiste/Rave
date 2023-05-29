import React, { useState, useEffect } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  View,
  useWindowDimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { playSound, stopSound } from "../actions";
import {
  Text,
  Button,
  Checkbox,
  IconButton,
  Portal,
  Dialog,
} from "react-native-paper";
import { useTheme } from "react-native-paper";
import { useAssets } from "expo-asset";

const MySounds = () => {
  const recordings = useSelector((state) => state.recordings);
  const sound = useSelector((state) => state.sound);
  const isPlayingArray = useSelector((state) => state.isPlayingArray);
  const defaultChecked = useSelector((state) => state.defaultChecked);
  const defaultPlaying = useSelector((state) => state.isPlaying);
  const [assets, error] = useAssets([require("../assets/test_sample.wav")]);
  const dispatch = useDispatch();

  const handleCheck = (selectedItem = null) => {
    let updatedRecordings;

    // Manage to have only one checkbox checked
    // Case is the list sounds checkbox
    if (selectedItem !== null) {
      // Default checked to true
      dispatch({
        type: "SET_DEFAULT_CHECKED",
        payload: false,
      });
      updatedRecordings = recordings.map((item) => {
        // I am on the concerned item
        if (item.uri === selectedItem.uri) {
          dispatch({
            type: "SET_SELECTED_FILE",
            payload: !item.isChecked ? selectedItem : null, // Not checked ? we update selectedItem else we clear
          });
          return { ...item, isChecked: !item.isChecked };
        }
        // Is not the concerned item
        return { ...item, isChecked: false };
      });
    } else {
      // Case is the default value checkbox
      // Clear the sounds's list checkbox
      updatedRecordings = recordings.map((item) => {
        return { ...item, isChecked: false };
      });
      // Update store
      dispatch({
        type: "SET_DEFAULT_CHECKED",
        payload: !defaultChecked,
      });
      !defaultChecked
        ? dispatch({
            type: "SET_SELECTED_FILE",
            payload: assets[0],
          })
        : dispatch({
            type: "SET_SELECTED_FILE",
            payload: null,
          }); // Not checked ? we update selectedItem else we clear
    }
    // Update list
    dispatch({ type: "SET_RECORDINGS", payload: updatedRecordings });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Mes sons 🔊
      </Text>
      {!recordings.length ? (
        <Text style={styles.container} variant="bodyMedium">
          Pas de son enregistré 😭, retourne dans "Enregistrement" pour
          t'enregistrer 😉.
        </Text>
      ) : (
        <FlatList
          data={recordings}
          renderItem={({ item, index }) => (
            <View style={styles.list}>
              <View style={styles.recordingItem}>
                <Text variant="titleMedium">{item.name}</Text>
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
              </View>
              <Checkbox.Android
                status={item?.isChecked ? "checked" : "unchecked"}
                onPress={() => handleCheck(item)}
              />
            </View>
          )}
          keyExtractor={(item) => item.uri}
        />
      )}
      <Text style={styles.title} variant="headlineSmall">
        Son par défaut : 🎷
      </Text>
      <View style={styles.list}>
        <View style={styles.recordingItem}>
          <Text>Démo</Text>
          <IconButton
            mode="contained"
            size={18}
            icon={!defaultPlaying ? "play" : "stop"}
            onPressIn={() => {
              dispatch({
                type: "IS_PLAYING",
                payload: !defaultPlaying,
              });
              if (defaultPlaying) {
                dispatch(stopSound(sound));
              } else {
                dispatch(playSound(assets[0].localUri, sound));
              }
            }}
          />
        </View>
        <Checkbox.Android
          status={defaultChecked ? "checked" : "unchecked"}
          onPress={() => handleCheck()}
        />
      </View>
    </View>
  );
};

const Explore = () => {
  const dispatch = useDispatch();
  const recordings = useSelector((state) => state.recordings);

  const pickFile = async () => {
    // Uncheck checkbox
    const updatedRecordings = recordings.map((item) => {
      return { ...item, isChecked: false };
    });
    // Store date
    dispatch({ type: "SET_RECORDINGS", payload: updatedRecordings });
    dispatch({ type: "SET_DEFAULT_CHECKED", payload: false });

    //Open phone nevigator to select audio
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });
      dispatch({ type: "SET_SELECTED_FILE", payload: result });
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User cancelled file picker dialog");
      } else {
        console.error("Error while picking file:", err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Sélectionner un son 🔍
      </Text>
      <View style={{ margin: 15 }}>
        <Button icon="upload" mode="contained" onPress={pickFile}>
          Choisir un fichier
        </Button>
      </View>
    </View>
  );
};

// Create tabs
const renderScene = SceneMap({
  first: MySounds,
  second: Explore,
});

export default function RaveView() {
  const layout = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const selectedFile = useSelector((state) => state.selectedFile);
  const [selectedValue, setSelectedValue] = useState("");
  const [data, setData] = useState([]);
  const serverAddress = useSelector((state) => state.serverAddress);
  const serverPort = useSelector((state) => state.serverPort);
  const sound = useSelector((state) => state.sound);
  const dispatch = useDispatch();
  const [downloadSoundUri, setDownloadSoundUri] = useState();
  const theme = useTheme();
  const [alertVisible, setAlertVisible] = useState(false);
  const hideAlert = () => {
    setAlertVisible(false);
    dispatch(stopSound(sound));
  };

  // Data for tabs
  const [index, setIndex] = useState(0);
  const [routes] = React.useState([
    { key: "first", title: "Sons disponible" },
    { key: "second", title: "Parcourir" },
  ]);

  useEffect(() => {
    // Get models's list
    axios
      .get(`http://${serverAddress}:${serverPort}/getmodels`)
      .then((response) => {
        setData(response.data.models);
      })
      .catch((error) => {
        console.log(error);
        alert("La connexion a échoué");
      });
  }, []);

  useEffect(() => {
    // Send the select model to the server when it changes
    if (selectedValue) {
      axios
        .get(
          `http://${serverAddress}:${serverPort}/selectModel/${selectedValue}`
        )
        .then()
        .catch((error) => {
          alert(error);
        });
    }
  }, [selectedValue]);

  const sendFile = async () => {
    if (!selectedFile) {
      alert("Séléctionner au moins un son ! 🔊");
      return;
    }
    // Display loader
    setLoading(true);

    // Handle case of is the sample
    let fileUri = selectedFile.localUri
      ? selectedFile.localUri
      : selectedFile.uri;

    //Post to server
    await FileSystem.uploadAsync(
      `http://${serverAddress}:${serverPort}/upload`,
      fileUri,
      {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: { filename: fileUri },
      }
    ).then(() => {
      downloadFile();
      setLoading(false);
    });
  };

  const downloadFile = async () => {
    // Create a directory in the app document directory
    let directory = FileSystem.documentDirectory + "my_directory";

    // Check if the directory already exists
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory);
    }

    // Download file
    const { uri } = await FileSystem.downloadAsync(
      `http://${serverAddress}:${serverPort}/download`,
      directory + "/hey.wav"
    );

    // get uri and open modal
    setDownloadSoundUri(uri);
    setAlertVisible(true);
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: "white" }}
      style={{ backgroundColor: theme.colors.primary }}
    />
  );

  return (
    <>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
      <View
        style={{
          height: "40%",
          borderTopColor: theme.colors.primary,
          borderTopWidth: 2,
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: 60,
          backgroundColor: "#fff",
        }}>
        <View>
          <ActivityIndicator size="large" animating={loading} />
          <Text variant="headlineSmall">
            Fichier séléctionné : {selectedFile ? selectedFile.name : "❌"}
          </Text>
        </View>
        <SelectDropdown
          defaultButtonText={"Séléctionner un modèle"}
          data={data}
          renderDropdownIcon={(isOpened) => {
            return (
              <IconButton
                icon={isOpened ? "chevron-up" : "chevron-down"}
                size={18}
              />
            );
          }}
          onSelect={(selectedItem) => {
            setSelectedValue(selectedItem);
          }}
          buttonStyle={styles.dropdown1BtnStyle}
          buttonTextStyle={styles.dropdown1BtnTxtStyle}
          dropdownIconPosition={"right"}
          dropdownStyle={styles.dropdown1DropdownStyle}
          rowStyle={styles.dropdown1RowStyle}
          rowTextStyle={styles.dropdown1RowTxtStyle}
          selectedRowStyle={styles.dropdown1SelectedRowStyle}
          dropdownOverlayColor={"transparent"}
        />

        <Button mode="contained" icon="sine-wave" onPress={sendFile}>
          Transformer
        </Button>

        <Portal>
          <Dialog
            style={{
              height: "30%",
            }}
            visible={alertVisible}
            onDismiss={hideAlert}>
            <Dialog.Title style={{ paddingVertical: 10 }}>
              Conversion réussie ✅
            </Dialog.Title>
            <IconButton
              icon={"close"}
              iconColor="red"
              onPress={hideAlert}
              style={{ position: "absolute", right: 0 }}
            />
            <Dialog.Content>
              <Text variant="bodyMedium">
                Ton audio a été converti avec succès, écoute le résultat 💥
              </Text>
            </Dialog.Content>
            <Dialog.Actions
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-around",
              }}>
              <Button
                style={{ paddingHorizontal: 10 }}
                mode="contained"
                icon="record"
                onPress={() => {
                  dispatch(playSound(selectedFile.uri, sound));
                }}>
                Original
              </Button>
              <Button
                style={{ paddingHorizontal: 10 }}
                mode="contained"
                icon="music"
                onPress={() => {
                  dispatch(playSound(downloadSoundUri, sound));
                }}>
                Modifié
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    padding: 10,
    color: "#663399",
    fontWeight: "bold",
  },
  list: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  tab: {
    width: "auto",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "red",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  tabActive: {
    backgroundColor: "theme.colors.primary",
  },
  tabText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  tabTextActive: {
    color: "#fff",
  },
  dropdown1BtnStyle: {
    width: "80%",
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: "auto",
  },
  dropdown1BtnTxtStyle: { textAlign: "left" },
  dropdown1DropdownStyle: { backgroundColor: "#fff" },
  dropdown1RowStyle: {
    backgroundColor: "#ffff",
    borderColor: "#C5C5C5",
    borderWidth: 1,
  },
  dropdown1RowTxtStyle: { color: "#444", textAlign: "left" },
  dropdown1SelectedRowStyle: { backgroundColor: "#fff" },
});
