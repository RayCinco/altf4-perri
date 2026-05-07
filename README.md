# Perri 🦜📢

Perri is a web-based fake news detection platform designed to help users identify misleading, suspicious, or potentially false information online. The application analyzes user-inputted news content and provides a “Chismis Meter” score that estimates how likely the information is fake or reliable.

The project also includes a Chrome Extension that allows users to quickly analyze articles, headlines, and online posts directly from their browser.

---

# ✨ Features

- 🔍 Fake News Detection
- 📊 Chismis Meter Analysis
- 📈 Real vs Fake News Comparison
- 🌐 Chrome Extension Integration
- 📰 Verified Resource Suggestions
- 🎨 Interactive and Modern UI
- ⚡ Real-time Analysis Feedback
- 📱 Responsive Design

---

# 🧠 How It Works

1. The user enters a news headline, article, or social media post via URL, Image, and Text.
2. Perri processes the text using its analysis system.
3. The application evaluates patterns commonly associated with fake news such as:
   - sensationalized wording
   - lack of credible sources
   - misleading phrasing
   - suspicious claims

4. The system generates:
   - a reliability percentage
   - a Chismis Meter score
   - explanation/reasoning for the result
   - links to verified sources when available

The Chrome Extension allows users to perform the same analysis directly while browsing websites.

---

# 🛠️ Technologies Used

- **Frontend:** Next.js, React, TypeScript
- **Backend:** 
- **Database:** 
- **AI:** 
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Browser Extension:** Chrome Extension API
- **Version Control:** Git & GitHub

---

# 📂 Project Structure

```bash
chismiscan/
│
├── app/                 # Main application pages
├── components/          # Reusable UI components
├── public/              # Static assets
├── extension/           # Chrome extension files
├── styles/              # Global styles
├── utils/               # Helper functions
├── README.md
└── package.json
```

---

# 🚀 Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/chismiscan.git
```

## 2. Navigate to the Project Folder

```bash
cd chismiscan
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run the Development Server

```bash
npm run dev
```

The application should now run on:

```bash
http://localhost:3000
```

---

# 🧩 Chrome Extension Setup

1. Open Google Chrome
2. Go to:

```bash
chrome://extensions/
```

3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select the `extension` folder from the project

---

# 👥 Developers

Developed by the Perri Team.

---

# 📌 Future Improvements

- Multilingual support
- Social media scanning
- Community reporting system
- Mobile application version

---

# 📄 License

This project is for educational and hackathon purposes.
