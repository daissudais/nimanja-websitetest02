import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";

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

export { app, db, analytics, contactDb };
