// firebase-messaging-sw.js

// 1. Import the Firebase App and Messaging SDKs from the CDN
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// 2. Initialize Firebase in the service worker
// Replace placeholder values with your Web App's config
firebase.initializeApp({
  apiKey: "AIzaSyCwGwpfBpIt-mrgxw3OXky1xruBO5p0Zf8",
  authDomain: "nimanjaproducts.firebaseapp.com",
  projectId: "nimanjaproducts",
  storageBucket: "nimanjaproducts.appspot.com",
  messagingSenderId: "899288144891",
  appId: "1:899288144891:web:2d0949c114d8fe54db095e"
});

// 3. Retrieve the messaging instance
const messaging = firebase.messaging();

// 4. (Optional) Handle background or custom data-only messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize how the notification is shown
  const notificationTitle = payload.notification?.title || 'New Alert!';
  const notificationOptions = {
    body: payload.notification?.body || 'Check your app for updates.',
    icon: '/images/favicon.png', // Add your own icon path
    badge: '/images/favicon.png' // Add your own badge path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
