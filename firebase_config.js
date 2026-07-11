// firebase_config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
// FIXED: Imported from the correct web library and included both getMessaging AND getToken
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";

// Primary Configuration (Nimanja Products)
const firebaseConfig = {
  apiKey: "AIzaSyCwGwpfBpIt-mrgxw3OXky1xruBO5p0Zf8",
  authDomain: "nimanjaproducts.firebaseapp.com",
  databaseURL: "https://nimanjaproducts-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nimanjaproducts",
  storageBucket: "nimanjaproducts.firebasestorage.app",
  messagingSenderId: "899288144891",
  appId: "1:899288144891:web:2d0949c114d8fe54db095e",
  measurementId: "G-QVWVGW7CQ0"
};

// Secondary Configuration (Dedicated Contact Page Database)
const contactFirebaseConfig = {
  databaseURL: "https://contactpage-d2442-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Primary App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

// Initialize Secondary App (Named instance to avoid conflicts)
const contactApp = initializeApp(contactFirebaseConfig, "contactApp");
const contactDb = getDatabase(contactApp);

// Initialize Messaging
const messaging = getMessaging(app);

// FIXED: Wrapped token retrieval in an async function to prevent top-level await errors
export const requestNotificationToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: "BKa-hzG6WQms5E3DN8WVvCwU_toIrgFhR16wBW2lH3uISK6SibvXcXpmDlkRP1YClPMDQqSekUH4gD50HwruT4g" 
    });
    
    if (currentToken) {
      console.log("FCM Token obtained successfully:", currentToken);
      return currentToken;
    } else {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
};

// Export instances for use across your application
export { app, db, analytics, contactDb, messaging };
