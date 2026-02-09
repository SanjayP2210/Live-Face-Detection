import FaceCapture from './Pages/FaceCapture'
import './App.css';
import AdvanceFaceCapture from './Pages/AdvanceFaceCapture';

function App() {
  const handleCapture = (data) => {
    console.log("Cropped Image:", data.cropImage);
    console.log("Full Image:", data.fullImage);
  };

  return (
    <div>
      <AdvanceFaceCapture
        enableDownload={true}
        enableBase64Viewer={true}
        onCapture={handleCapture}
      />
    </div>
  );
}

export default App
