# ✨ Smart Face Capture (React + Mediapipe)

A modern biometric-style face capture component built using **React + Mediapipe**.

This project provides a production-ready face capture experience with smooth detection, auto-capture, download options, and Base64 extraction — similar to real-world KYC / onboarding systems used in fintech and identity verification platforms.

---

## 🌐 Live Demo

👉 https://live-face-detection.vercel.app/

---

## 📸 Project Overview

Smart Face Capture is a reusable React component that enables:

- Real-time face detection
- Stable auto-capture
- Smooth animated detection box
- Cropped + full image export
- Download options (JPG / PNG)
- Base64 extraction
- Camera switching
- Clean, modern biometric UI

This project demonstrates advanced frontend concepts including:

- HTML5 Canvas overlays
- Mediapipe face detection
- Smooth animation interpolation
- Auto capture logic
- Reusable component architecture
- Clean UX design

---

## 🚀 Features

✅ Real-time face detection  
✅ Smooth animated detection box  
✅ Auto capture when face is stable  
✅ Switch camera (front/back)  
✅ Capture preview with Retake / OK  
✅ Download as JPG  
✅ Download as PNG  
✅ Download Cropped + Full image separately  
✅ Base64 viewer (collapsible)  
✅ Remove captured image  
✅ Animated border glow  
✅ Capture flash animation  
✅ "Face Detected ✅" badge  
✅ Reusable component with configurable props  
✅ Vercel deployment ready  

---

## 🖥️ Demo Flow (User Interaction)

1. Click **Start Capture**
2. Camera opens in modal
3. Face is detected with glowing animated box
4. When face is stable → auto capture triggers
5. Preview screen appears
6. User can:
   - Retake
   - Confirm
7. After confirmation:
   - Captured image shows on main screen
   - Download options appear
   - Base64 viewer available
   - Remove button available

---

## 🛠️ Tech Stack

- React
- Reactstrap
- react-webcam
- @mediapipe/face_detection
- HTML5 Canvas API
- Bootstrap
- Vercel (Deployment)

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm start
```

---

## 📥 Required Dependencies

If installing manually:

```bash
npm install reactstrap bootstrap react-webcam @mediapipe/face_detection @mediapipe/camera_utils
```

Import Bootstrap in `index.js`:

```javascript
import 'bootstrap/dist/css/bootstrap.min.css';
```

---

## 🧩 Component Usage

Import inside your `App.js`:

```jsx
import FaceCapture from "./components/FaceCapture";

function App() {
  const handleCapture = (data) => {
    console.log("Cropped Image:", data.cropImage);
    console.log("Full Image:", data.fullImage);
  };

  return (
    <FaceCapture
      enableDownload={true}
      enableBase64Viewer={true}
      onCapture={handleCapture}
    />
  );
}

export default App;
```

---

## ⚙️ Component Props

| Prop | Type | Default | Description |
|------|------|----------|------------|
| enableDownload | boolean | true | Enable download buttons |
| enableBase64Viewer | boolean | true | Enable Base64 textarea |
| onCapture | function | null | Callback when image captured |

### `onCapture` returns:

```javascript
{
  cropImage: "base64-string",
  fullImage: "base64-string"
}
```

---

## 📁 Project Structure

```
src/
 ├── components/
 │     └── FaceCapture.jsx
 ├── App.js
 ├── App.css
 └── index.js
```

---

## 🌍 Deployment

### 🔹 Deploy to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

---

### 🔹 Deploy to Vercel

1. Push project to GitHub
2. Go to https://vercel.com
3. Click **New Project**
4. Import your repository
5. Click Deploy

No special configuration required.

---

## 🔮 Future Enhancements

- Face confidence score display
- Liveness detection
- Backend upload integration
- TypeScript support
- NPM package version
- Performance optimization for mobile

---

## 📜 License

MIT License

---

## 🙌 Author

**Sanjay Panchal**  
Frontend / Full Stack Developer  

- 🔗 GitHub: https://github.com/SanjayP2210 
- 💼 LinkedIn: https://linkedin.com/in/your-profile  
- 🌐 Portfolio: https://sanjay-panchal-portfolio.netlify.app/

---

⭐ If you found this project helpful, consider giving it a star!