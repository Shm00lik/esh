**General Planning**

* Two system roles: **admin** and **user**.
* **Admin** manages onboarding, coin balances, pinned messages, and the leaderboard.
* **Users** join by scanning a QR, set a username, chat, and transfer coins.
* Backend exposes a few REST endpoints for actions and one WebSocket stream for real-time updates.
* No login, passwords, or session logic. Only a persistent `user_key` saved locally.
* The flow is circular and self-contained: admin creates access → users join → users interact → admin observes and manages.
* Everything is meant to stay lightweight and reactive, supporting instant updates and short attention cycles.

---

**QR Flow**

1. **Admin creates QR** in their control panel.

   * Each QR represents a new user key.
   * The generated QR image is shown instantly on the admin’s screen.

2. **User scans QR** using their phone camera or scanner inside the app.

   * The app reads the key directly from the QR.
   * The key is stored locally on the device.

3. **App checks the key status.**

   * If no username is set, the user is prompted to enter one.
   * If the username already exists, it reconnects the user to their previous account automatically.

4. **User reaches the home screen.**

   * They see the real-time chat at the center.
   * A button or icon allows transferring coins to others.
   * Balances and messages update through the live socket stream.

---

**Admin Features and Tasks**

* **Create QR:** generate new user entries; each user starts with a default coin balance.
* **Set or remove pinned message:** manage a global announcement visible to all users.
* **Adjust balances:** increase or decrease any user’s coins directly from the table.
* **View all users:** live-updating table with usernames, IDs, coin amounts, and quick actions.
* **Regenerate QR:** refresh a user’s key and show a new QR if they lose access.
* **Monitor leaderboard:** view ranking by coin balance in real time.
* **Chat oversight:** see messages as they appear and mark admin messages in red.
* **Display mode:** open the leaderboard and chat feed on a large TV screen, automatically refreshing through the WebSocket.

---

**UI Planning**

* **User mobile interface**

  * Initial QR scan or direct key paste.
  * Automatic status check → username entry if first-time user.
  * Home screen with:

    * Top area: main “Send” or “Action” button.
    * Middle area: live chat feed where messages disappear after several seconds.
    * Bottom area: input field (RTL-friendly) with send arrow.
  * Secondary page for transferring coins:

    * List of usernames.
    * Amount input.
    * Confirmation button.
  * Real-time balance and message updates via the socket.

* **Admin interface**

  * Desktop layout optimized for wide screen.
  * Left or top control bar with buttons:

    * **Create QR**
    * **Set/Remove Pinned**
    * **Leaderboard View**
  * Main area: live user table with columns for:

    * Username
    * User ID
    * Coin balance
    * QR icon (opens enlarged QR)
    * “+” and “−” buttons for balance adjustment
  * Dialog popups for QR creation and coin modification confirmation.
  * Integrated socket listener keeps the table and leaderboard synced automatically.

* **Leaderboard / Display view**

  * Clean layout, visible from distance.
  * Displays top users by coin count.
  * side panel with the live chat feed.
  * Auto-updating through the WebSocket with no manual refresh.
  * Designed for constant on-screen display in events or rooms.

---

**Overall Design Notes**

* Everything updates live, no manual reloads.
* Simple color coding distinguishes admin and normal user.
* Minimal text and shallow navigation hierarchy.
* All screens use the same base theme and large, touch-ready UI elements.
* System designed to be self-running: once admin generates QRs, the rest flows automatically.
* Admin accounts are like normal accounts except they have access to leaderboard and panel and their messages are in red