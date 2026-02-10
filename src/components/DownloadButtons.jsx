import React from 'react'
import { Button } from 'reactstrap'

const DownloadButtons = ({
    enableDownload,
    enableBase64Viewer,
    showBase64,
    setShowBase64,
    capturedImage,
    downloadPng,
    downloadJpg
}) => {
    return (
        <div> {enableDownload &&
            <><div className="post-actions">
                <Button size="sm" color="primary" onClick={() => downloadJpg("cropped")}>
                    JPG (Cropped)
                </Button>

                <Button size="sm" color="secondary" onClick={() => downloadPng("cropped")}>
                    PNG (Cropped)
                </Button>
            </div>

                <div className="post-actions">
                    <Button size="sm" color="info" onClick={() => downloadJpg("full")}>
                        JPG (Full)
                    </Button>

                    <Button size="sm" color="dark" onClick={() => downloadPng("full")}>
                        PNG (Full)
                    </Button>
                </div></>
        }

            {enableBase64Viewer &&
                <>
                    <div className="post-actions">
                        <Button
                            size="sm"
                            color="success"
                            onClick={() => setShowBase64(!showBase64)}
                        >
                            {showBase64 ? "Hide Base64" : "Show Base64"}
                        </Button>
                    </div>
                    <>
                        {showBase64 && (
                            <textarea
                                value={capturedImage}
                                readOnly
                                className="base64-box"
                            />
                        )}
                    </>
                </>
            }</div>
    )
}

export default DownloadButtons