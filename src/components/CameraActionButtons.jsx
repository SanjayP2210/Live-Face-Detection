import { IconCamera, IconCheckbox, IconRefresh, IconRotateClockwise } from "@tabler/icons-react";
import { Button, Col, Row } from "reactstrap";

const CameraActionButtons = ({
  photo,
  capturePhoto,
  faceDetected,
  handleOk,
  retakePhoto,
  handleSwitchCamera
}) => {
  return (
    <Row className="text-center">
      <Col>
        {!photo ? (
          <>
           <div className="camera-capture-action-button">
          <Button
            color="secondary"
            className="me-3"
            onClick={handleSwitchCamera}
          >
            <IconRotateClockwise className="me-2" />
             Switch Camera
          </Button>
          <Button
            color="primary"
            onClick={capturePhoto}
            disabled={!faceDetected}
          >
            <IconCamera className="me-2" />
            Capture
          </Button>
          </div>
          </>
        ) : (
          <div className="mb-4">
            <Button color="primary" onClick={handleOk} className="me-3">
              <IconCheckbox className="me-2" />
              Ok
            </Button>
            <Button
              color="success"
              disabled={!faceDetected}
              onClick={retakePhoto}
            >
              <IconRefresh className="me-2" />
              ReTake Picture
            </Button>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default CameraActionButtons;
