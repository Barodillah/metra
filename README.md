# 🌟 METRA - Spiritual Data Science Platform

![METRA Banner](https://img.shields.io/badge/METRA-Spiritual%20Data%20Science-6366F1?style=for-the-badge&logo=sparkles&logoColor=white)

**METRA** adalah platform Spiritual Data Science yang menggabungkan kebijaksanaan kuno dengan teknologi AI modern untuk memberikan panduan hidup yang presisi, optimis, dan terukur.

## ✨ Fitur Utama

### 🔮 Sistem Spiritual Terintegrasi
- **Primbon Jawa** - Kalkulasi Weton dan Neptu untuk harmoni alam
- **Metafisika Cina** - Analisis BaZi dan Shio
- **Jyotish India** - Perhitungan posisi planet dan peta karma
- **Zodiak Barat** - Star sign dan numerology Life Path

### 🤖 Metra AI Advisor
- Chatbot AI berbasis spiritual data
- Panduan personal berdasarkan data kelahiran
- Insight harian yang disesuaikan profil user

### 📊 Dashboard Personal
- Visualisasi data spiritual lengkap
- Time Picker & Date Picker interaktif
- Progress tracking dan daily insights

## 🛠️ Tech Stack

| Teknologi | Versi |
|-----------|-------|
| React | ^18.3.1 |
| Vite | ^6.0.7 |
| React Router DOM | ^7.1.1 |
| TailwindCSS | ^3.4.17 |
| Lucide React | ^0.468.0 |

## 📁 Struktur Proyek

```
metra/
├── public/
│   └── metra-icon.svg
├── src/
│   ├── components/
│   │   ├── DatePicker.jsx      # Custom date picker component
│   │   ├── TimePicker.jsx      # Custom time picker with period labels
│   │   ├── Navbar.jsx          # Navigation bar
│   │   └── ProtectedRoute.jsx  # Auth protection wrapper
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication state management
│   ├── pages/
│   │   ├── LandingPage.jsx     # Homepage dengan hero & features
│   │   ├── LoginPage.jsx       # User login
│   │   ├── RegisterPage.jsx    # User registration
│   │   ├── DashboardPage.jsx   # User dashboard dengan spiritual data
│   │   └── ChatbotPage.jsx     # Metra AI Advisor interface
│   ├── App.jsx                 # Main routing component
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json                 # Vercel deployment config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/metra.git
   cd metra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Buka browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🌐 Deployment

Proyek ini sudah dikonfigurasi untuk deployment di **Vercel**. File `vercel.json` sudah disertakan untuk handling SPA routing.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deploy ke Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel
```

## 📝 Kalkulasi Spiritual

### Weton Jawa
Menghitung hari lahir dalam kalender Jawa (Senin-Minggu) beserta pasaran (Legi, Paing, Pon, Wage, Kliwon) dan nilai Neptu.

### Zodiak Barat
Menentukan zodiak berdasarkan tanggal lahir (Aries-Pisces).

### Life Path Number
Numerology untuk menemukan takdir utama berdasarkan penjumlahan tanggal lahir.

### Shio Cina
Menentukan shio berdasarkan tahun lahir dalam siklus 12 tahun.

## 🎨 Design System

- **Primary Color**: Indigo (#6366F1)
- **Secondary Color**: Cyan (#06B6D4)
- **Accent Colors**: Amber, Rose
- **Background**: Dark Slate (#0F172A)
- **Font**: Inter (Google Fonts)

## 📜 License

© 2026 METRA Spiritual Data Science. All rights reserved.

---

<div align="center">
  <strong>✨ Optimism Through Data ✨</strong>
</div>
