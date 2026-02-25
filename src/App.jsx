import { useEffect, useState } from 'react';
import './App.css';
import WebcamCapture from './components/CameraTest';
import FaceCapture from './components/FaceCapture';
import MobileCamera from './components/MobileCamera';

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const handleCapture = (data) => {
    console.log("Cropped Image:", data.cropImage);
    console.log("Full Image:", data.fullImage);
  };

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <div>
      {isMobile ?
        <MobileCamera
          enableDownload={true}
          enableBase64Viewer={true}
          onCapture={handleCapture}
        /> :
        <FaceCapture
          enableDownload={true}
          enableBase64Viewer={true}
          onCapture={handleCapture}
        />
      }
      {/* <WebcamCapture/> */}
    </div>
  );
}

export default App
