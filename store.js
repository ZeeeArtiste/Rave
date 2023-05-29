import { createStore, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import thunk from "redux-thunk";
import AsyncStorage from "@react-native-async-storage/async-storage";

const initialState = {
  recordings: [],
  defaultChecked: false,
  selectedFile: null,
  sound: null,
  isPlaying: false,
  isPlayingArray: [],
  serverAddress: null,
  serverPort: null,
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case "SET_IS_RECORDING":
      return { ...state, isRecording: action.payload };
    case "SET_DEFAULT_CHECKED":
      return { ...state, defaultChecked: action.payload };
    case "SET_SOUND":
      return { ...state, sound: action.payload };
    case "IS_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "IS_PLAYING_ARRAY":
      return { ...state, isPlayingArray: action.payload };
    case "SET_RECORDINGS":
      return {
        ...state,
        recordings: action.payload,
        isPlayingArray: (() => {
          let arr;
          // First store of recordings, we preare an array of state
          if (state.isPlayingArray.length === 0) {
            arr = new Array(action.payload.length).fill(false);
          } else {
            arr = state.isPlayingArray.slice();
            // Case of item's adding
            if (action.payload.length > arr.length) {
              arr.push(false); // Add state
            }
            // Case of item's deleting
            if (action.payload.length < arr.length) {
              arr.pop(); // Delete a state
            }
          }
          return arr;
        })(),
      };
    case "SET_SELECTED_FILE":
      return { ...state, selectedFile: action.payload };
    case "SET_SERVER_ADDRESS":
      return { ...state, serverAddress: action.payload };
    case "SET_SERVER_PORT":
      return { ...state, serverPort: action.payload };
    default:
      return state;
  }
}

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["serverAddress", "serverPort"], // Data to persist
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer, applyMiddleware(thunk));
const persistor = persistStore(store);

export { store, persistor };
