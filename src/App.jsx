import './App.css';
import WebcamCapture from './components/CameraTest';
import FaceCapture from './components/FaceCapture';

function App() {
  const handleCapture = (data) => {
    console.log("Cropped Image:", data.cropImage);
    console.log("Full Image:", data.fullImage);
  };

  return (
    <div>
      <FaceCapture
        enableDownload={true}
        enableBase64Viewer={true}
        onCapture={handleCapture}
      />
      {/* <WebcamCapture/> */}
    </div>
  );
}

export default App
