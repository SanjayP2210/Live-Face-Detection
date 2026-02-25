import './App.css';
import FaceCapture from './components/FaceCapture';

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
      {/* <WebcamCapture/> */ }
  );
}

export default App
