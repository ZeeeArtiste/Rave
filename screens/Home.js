import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Button, TextInput, Text, Divider } from "react-native-paper";
import { useNavigationState } from "@react-navigation/native";
import { stopSound } from "../actions";

const Home = (navigation) => {
  // Get data from store
  const dispatch = useDispatch();
  const serverAddress = useSelector((state) => state.serverAddress);
  const serverPort = useSelector((state) => state.serverPort);
  const sound = useSelector((state) => state.sound);

  // Stop sound when screen changes
  useEffect(() => {
    if (sound) {
      dispatch(stopSound(sound));
    }
  }, [useNavigationState((state) => state.index)]);

  // Test connection
  const connection = () => {
    axios
      .get(`http://${serverAddress}:${serverPort}`)
      .then(() => {
        navigation.navigation.navigate("Enregistrement");
      })
      .catch((error) => {
        console.log(error);
        alert("La connexion a échoué");
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.item} variant="displayLarge">
        RAVE
      </Text>
      <TextInput
        style={styles.item}
        label="Adresse IP du serveur :"
        type="outlined"
        value={serverAddress}
        onChangeText={(text) =>
          dispatch({ type: "SET_SERVER_ADDRESS", payload: text })
        }
      />
      <TextInput
        style={styles.item}
        label="Port :"
        type="outlined"
        value={serverPort}
        onChangeText={(text) =>
          dispatch({ type: "SET_SERVER_PORT", payload: text })
        }
      />
      <Button
        style={styles.item}
        icon="connection"
        mode="contained"
        onPress={connection}>
        Tester la connexion
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  p: {
    padding: 10,
  },
  item: {
    textAlign: "center",
    margin: 10,
    width: "90%",
  },
});

export default Home;
