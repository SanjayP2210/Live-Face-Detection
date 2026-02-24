const ImageDisplay = ({photo}) => {
  return (
    <img
      src={photo}
      alt="Captured"
      style={{
        width:'100%',
        height:'auto',
        // transform: mirrored ? "scaleX(-1)" : '',
      }}
      className="captured-image"
    />
  );
};

export default ImageDisplay;
