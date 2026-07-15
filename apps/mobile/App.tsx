import { StatusBar } from "expo-status-bar";
import { PlannerScreen } from "./src/screens/PlannerScreen";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <PlannerScreen />
    </>
  );
}
