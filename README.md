# Perri 🦜📢

Perri is a web-based fake news detection platform designed to help users identify misleading, suspicious, or potentially false information online. The application analyzes user-submitted content and generates a “Chismis Meter” score that estimates the reliability of the information.

The project also includes a Chrome Extension that allows users to analyze articles, headlines, and online posts directly from their browser.

---

# ✨ Features

- 🔍 Fake News Detection
- 📊 Chismis Meter Analysis
- 📈 Real vs. Fake News Comparison
- 🌐 Chrome Extension Integration
- 📰 Verified Resource Suggestions
- 🎨 Interactive and Modern UI
- ⚡ Real-Time Analysis Feedback
- 📱 Responsive Design

---

# 🧠 How It Works

1. The user submits a news headline, article, social media post, URL, image, or text.
2. Perri processes the content through its analysis pipeline.
3. The application evaluates patterns commonly associated with misinformation, including:
   - sensationalized wording
   - lack of credible sources
   - misleading phrasing
   - suspicious claims

4. The system generates:
   - a reliability percentage
   - a Chismis Meter score
   - explanations and reasoning for the result
   - links to verified sources when available

The Chrome Extension allows users to perform the same analysis directly while browsing websites.

---

# 🛠️ Technologies Used

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** Supabase
- **AI:** Gemini AI, SuperDev AI
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Browser Extension:** Chrome Extension API
- **Version Control:** Git & GitHub

---

# 📂 Project Structure

```bash
public/
├── logo/
└── showcase/

src/
├── app/
│   ├── api/
│   ├── chrome-extension/
│   ├── history/
│   ├── types/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│
└── lib/
    ├── ai/
    ├── pipeline/
    ├── search/
    ├── ai_chatbot.ts
    ├── ai_personality.ts
    ├── ai_search.ts
    ├── ai.ts
    ├── apiClient.ts
    ├── chismis.ts
    ├── media_literacy.ts
    ├── ocr.ts
    ├── source_filter.ts
    └── supabaseClient.ts
```

---

# 🚀 Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/altf4-perri.git
```

## 2. Navigate to the Project Folder

```bash
cd frontend
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run the Development Server

```bash
npm run dev
```

The application should now run at:

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
5. Select the `chrome-extension` folder from the project directory

---

# 👥 Team ALTF4

Developers behind Perri 🦜

- Levine Kiana Centeno
- Raymond Cinco
- Jan Chester Asuncion
- Syzmon Dave Abuan

---

# 📌 Future Improvements

- Multilingual support
- Social media scanning
- Community reporting system
- Mobile application version

---

# 📄 License

This project was created for educational and hackathon purposes.
