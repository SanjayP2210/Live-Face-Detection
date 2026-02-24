import React from "react";
import { Spinner } from "reactstrap";

const CameraLoader = ({msg}) => {
  return (
  <div className="status mt-3">
    <div>
      <Spinner size="sm" /> {msg} Camera...
    </div>
  </div>
)};

export default CameraLoader;
