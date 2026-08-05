// Extends the static app.json and injects the Google Maps native SDK key from the
// environment at build time (so the key isn't committed). Set
// EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your EAS build env / .env.
// The native map (react-native-maps + Google provider) requires this key on both
// platforms and a development build (it doesn't run in Expo Go on iOS).
const base = require("./app.json").expo;
const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = () => ({
  ...base,
  ios: {
    ...base.ios,
    config: { ...(base.ios && base.ios.config), ...(mapsKey ? { googleMapsApiKey: mapsKey } : {}) },
  },
  android: {
    ...base.android,
    config: { ...(base.android && base.android.config), ...(mapsKey ? { googleMaps: { apiKey: mapsKey } } : {}) },
  },
});
