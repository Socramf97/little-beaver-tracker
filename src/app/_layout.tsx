import { Stack, router, type Href } from "expo-router";
import Toast from "react-native-toast-message";
import { ActiveBabyProvider } from "../components/ActiveBabyProvider";

import * as Notifications from "expo-notifications";
import { useEffect } from "react";

// Wrap the app with ActiveBabyProvider so every screen
// can access the currently selected baby.
export default function RootLayout() {
  // when a notification is pressed, it will send that listener
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") router.navigate(url as Href);
      },
    );
    return () => sub.remove();
  }, []);

  return (
    <>
      <ActiveBabyProvider>
        <Stack />
        <Toast />
      </ActiveBabyProvider>
    </>
  );
}
