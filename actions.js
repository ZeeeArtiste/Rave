import { Audio } from "expo-av";

// Play a sound from his uri
export const playSound = (uri, sound, i = null) => {
  return async (dispatch, getState) => {
    try {
      const isPlayingArray = getState().isPlayingArray;
      // If a sound is playing, stop it
      if (sound) {
        await sound.unloadAsync();
        // Update state of playing state
        // Here for list of sound
        dispatch({
          type: "IS_PLAYING_ARRAY",
          payload: isPlayingArray.map(() => false),
        });
        // Here for main sound (which has just been recorded or default sound)
        dispatch({ type: "IS_PLAYING", payload: false });
      }

      // Here case of sounds's list
      if (i != null) {
        dispatch({
          type: "IS_PLAYING_ARRAY",
          payload: isPlayingArray.map((el, _i) => (_i === i ? true : false)), // Update the concerned sound
        });
      } else {
        // Case of main sound (which has just been recorded or default sound)
        dispatch({ type: "IS_PLAYING", payload: true }); // Update the sound
      }

      // Crate audio with sound on
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: uri },
        { shouldPlay: true }
      );

      // Sound is finish
      newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.didJustFinish) {
          // Here case of sounds's list
          if (i != null) {
            dispatch({
              type: "IS_PLAYING_ARRAY",
              payload: isPlayingArray.map((el, _i) => (_i === i ? false : el)), // Update the concerned sound
            });
          } else {
            // Case of main sound (which has just been recorded or default sound)
            dispatch({ type: "IS_PLAYING", payload: false });
          }
        }
      });
      // Store new sound
      dispatch({ type: "SET_SOUND", payload: newSound });
    } catch (error) {
      console.log("playSound erreur", error);
    }
  };
};

// Stop a sound
export const stopSound = (sound) => {
  return async (dispatch, getState) => {
    try {
      const isPlayingArray = getState().isPlayingArray;
      const isPlaying = getState().isPlaying;
      // Stop current sound
      sound.unloadAsync();
      // Case of main sound (which has just been recorded or default sound)
      if (isPlaying) {
        dispatch({ type: "IS_PLAYING", payload: false });
      } else {
        // Here case of sounds's list
        dispatch({
          type: "IS_PLAYING_ARRAY",
          payload: new Array(isPlayingArray.length).fill(false),
        });
      }
    } catch (error) {
      console.log("stopSound erreur", error);
    }
  };
};
