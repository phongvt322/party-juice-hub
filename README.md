# Party Juice Hub 🍹 (Trái Cây Mỗi Ngày)

> **Office party drink order organizer with live `traicaymoingay.com` catalog, customization (sugar/ice/notes), and 1-click cart injector.**

Built to streamline ordering office drinks from [traicaymoingay.com](https://traicaymoingay.com) during team celebrations, milestones, or afternoon tea breaks.

---

## ✨ Features

- 🥤 **Live Catalog Sync**: Automatically loads drink categories, juices, smoothies, and prices in real-time from `traicaymoingay.com`.
- 🎛️ **Drink Customization**: Select size, adjust sweetness levels (0%, 30%, 50%, 70%, 100%), ice levels, and add custom notes.
- 👤 **Participant Identity**: Simple name prompt with persistent browser storage so each team member sees their own selections.
- 📋 **Prep Checklist**: Automatically aggregates identical drink variations and custom notes to make order verification quick and error-free.
- ⚡ **1-Click Cart Injector**:
  - **Auto-Clear Previous Cart**: Option to automatically empty the merchant's cart via `/cart/clear.js` before injecting to avoid duplicate orders or accidental leftover items.
  - **Bookmarklet**: Drag-and-drop button to browser bookmarks bar; click on `traicaymoingay.com` to inject the entire party order into the merchant's cart in seconds.
  - **F12 Console Script**: Copyable snippet to run in DevTools console on the merchant's site.
  - **Zalo / Hotline Bill Summary**: Pre-formatted text summary ready to message the store with company VAT invoicing support.
- 🔄 **Dual Deployment Modes**:
  - **ArtifactHub**: Native integration with ArtifactHub's backend database and storage.
  - **Standalone / GitHub Pages**: Runs as a pure static site with persistent sync to Google Sheets via Google Apps Script webhook.

---

## 🚀 Getting Started

### Local Preview
Simply open `index.html` in any modern web browser or serve via static HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .
```

Visit `http://localhost:8080` in your browser.

---

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Branch**, select `main` (root) and click **Save**.
4. Once deployed, share the link with your team!

### Standalone Google Sheets Setup
If running standalone on GitHub Pages:
1. Open the app and click the **📊 Sheet** button in the header.
2. Enter your Google Apps Script Web App URL.
3. Orders will automatically sync to your Google Sheet in real time.

---

## 📄 License

MIT
