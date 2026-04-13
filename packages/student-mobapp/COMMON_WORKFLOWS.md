# Generate KeyStore: 
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# View KeyStore: 
keytool -list -v -keystore my-release-key.keystore -alias my-key-alias

# Integrate PocketBase:

import PB from "pocketbase";
export const pb = new PB('https://rasult22.pockethost.io')

import EventSource from "react-native-sse";
if (!global.EventSource) {
  (EventSource as any).CONNECTING = 0;
  (EventSource as any).OPEN = 1;
  (EventSource as any).CLOSED = 2;
  global.EventSource = EventSource as typeof global.EventSource;
}