import FaceCapture from './components/FaceCapture'
import './App.css';

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
    </div>
  );
}

export default App
