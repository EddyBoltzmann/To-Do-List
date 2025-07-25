# To-Do List

A modern, feature-rich To-Do List web application built with HTML, CSS, JavaScript, and Firebase.  
Includes calendar view, reminders, priorities, labels, search/filter, user authentication, PWA support, light/dark themes, and more.

![screenshot](docs/screenshot.png)

---

## Features

- **User Authentication:** Sign up/login with email/password, set a nickname as your public username.
- **Profile Management:** Edit your nickname anytime.
- **Task Management:** Add, edit, delete, duplicate, reorder, and mark tasks as completed.
- **Calendar View:** See tasks per day, navigate by month.
- **Reminders:** Optional browser notifications for tasks.
- **Priorities & Labels:** Assign priorities (High/Medium/Low) and custom labels/tags to tasks.
- **Search, Filter & Sort:** Powerful search bar, filter by priority, and sorting options.
- **Themes:** Light and dark mode toggle.
- **Responsive Design:** Works great on desktop and mobile.
- **PWA:** Installable as a Progressive Web App (PWA) with offline support.
- **Drag-and-drop (Desktop):** Reorder tasks with drag-and-drop.
- **Task Duplication:** Copy tasks to any date.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/EddyBoltzmann/To-Do-List.git
cd To-Do-List
```

### 2. Firebase Setup

- [Create a Firebase project](https://console.firebase.google.com/).
- Enable **Authentication** (Email/Password).
- Enable **Cloud Firestore** (start in test mode for development).
- [Optional] Enable Cloud Messaging for advanced reminders.
- In your Firebase Console, copy your Firebase config and replace the placeholder in `app.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};
```

### 3. Run Locally

Just open `index.html` in your browser! (You may need to serve via HTTP for service worker/PWA features, e.g. `npx serve` or `python3 -m http.server`).

---

## Project Structure

```
/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── sw.js
├── docs/
│   └── screenshot.png
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## Additional Setup

- Add your own app icons (`icons/icon-192.png`, `icons/icon-512.png`) for best PWA results.
- For browser notifications, make sure to allow notifications when prompted.

---

## Security

- All authentication and data are handled via Firebase.
- For production, review your Firestore security rules.

---

## Credits

- UI inspired by modern task managers and calendar apps.
- Built by [EddyBoltzmann](https://github.com/EddyBoltzmann).

---

## License

MIT
#   T o - D o - L i s t 
 
 
