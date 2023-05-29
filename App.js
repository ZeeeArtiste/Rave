import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NavigationContainer,
  useNavigationState,
} from "@react-navigation/native";
import Home from "./screens/Home";
import Rave from "./screens/Rave";
import Record from "./screens/Record";
import { Provider } from "react-redux";
import { store, persistor } from "./store";
import { Provider as PaperProvider } from "react-native-paper";
import { PersistGate } from "redux-persist/integration/react";

export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Connexion" component={Home} />
              <Stack.Screen name="Enregistrement" component={Record} />
              <Stack.Screen name="Modification" component={Rave} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}
