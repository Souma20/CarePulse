import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  Alert,
  IconButton
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const ImagePreview = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
}));

const AccidentOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  border: `2px solid ${theme.palette.error.main}`,
  borderRadius: "4px",
  pointerEvents: "none",
  "&::after": {
    content: "attr(data-label)",
    position: "absolute",
    top: "-24px",
    left: "0",
    background: theme.palette.error.main,
    color: theme.palette.common.white,
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
}));

const ResultItem = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": {
    borderBottom: "none",
  },
}));

const AccidentDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imageRef = useRef(null);

  const loadImageBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectionResult(null);
    setError(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setError(null);
  };

  const handleDetectClick = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const base64Image = await loadImageBase64(selectedFile);
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/accident-detection-8dvh5/1",
        params: {
          api_key: "RMg3UQ5Sr6ziHjXX4RFZ", // Note: Move this to environment variable in production
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      setDetectionResult(response.data);
    } catch (error) {
      console.error(error.message);
      setError("Failed to analyze image. Please try again.");
    }
    setLoading(false);
  };

  // Calculate overlay positions based on detection results
  const renderAccidentOverlays = () => {
    if (!detectionResult || !detectionResult.predictions || !imageRef.current) return null;

    const imgWidth = imageRef.current.clientWidth;
    const imgHeight = imageRef.current.clientHeight;
    const originalWidth = detectionResult.image.width;
    const originalHeight = detectionResult.image.height;

    // Scale factor between original image and displayed image
    const scaleX = imgWidth / originalWidth;
    const scaleY = imgHeight / originalHeight;

    return detectionResult.predictions.map((pred, index) => {
      // Calculate scaled position and dimensions
      const x = (pred.x - pred.width / 2) * scaleX;
      const y = (pred.y - pred.height / 2) * scaleY;
      const width = pred.width * scaleX;
      const height = pred.height * scaleY;

      return (
        <AccidentOverlay
          key={index}
          data-label={`${pred.class} (${Math.round(pred.confidence * 100)}%)`}
          sx={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      );
    });
  };

  const getSeverityColor = (classification) => {
    switch (classification.toLowerCase()) {
      case "severe":
        return "error";
      case "moderate":
        return "warning";
      case "minor":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        alignItems: "center",
        maxWidth: 1000,
        mx: "auto",
        p: 3,
      }}
    >
      <Typography variant="h4" fontWeight="bold" color="primary">
        Vehicle Accident Detection
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} width="100%">
        {/* Upload Section */}
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Upload Image
            </Typography>

            {!selectedFile ? (
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  border: "2px dashed #ccc",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  borderRadius: 2,
                  background: "#f9f9f9",
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Drag & drop an image or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Supported formats: JPG, PNG
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload Image
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
              </Paper>
            ) : (
              <Box>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 280,
                    mb: 2,
                    border: "1px solid #eee",
                    borderRadius: 1,
                  }}
                >
                  <ImagePreview>
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Preview"
                      style={{ maxHeight: "280px" }}
                    />
                    {detectionResult && renderAccidentOverlays()}
                  </ImagePreview>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="space-between">
                  <Typography noWrap variant="body2" sx={{ flex: 1, overflow: "hidden" }}>
                    {selectedFile.name}
                  </Typography>
                  <IconButton size="small" onClick={handleClearFile} color="default">
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleDetectClick}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  {loading ? "Analyzing..." : "Detect Accident"}
                </Button>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Detection Results
            </Typography>

            {!detectionResult && !loading ? (
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  border: "2px dashed #eee",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  borderRadius: 2,
                  background: "#f9f9f9",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Detection results will appear here
                </Typography>
              </Paper>
            ) : loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {detectionResult.predictions.length === 0 ? (
                  <Alert severity="info">No accidents detected in this image.</Alert>
                ) : (
                  <>
                    <Alert
                      severity={
                        detectionResult.predictions.some(p => p.class === "severe")
                          ? "error"
                          : "warning"
                      }
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        Accident Detected!
                      </Typography>
                    </Alert>

                    <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
                      {detectionResult.predictions.map((pred, index) => (
                        <ResultItem key={index}>
                          <Box>
                            <Typography variant="subtitle2">Detection #{index + 1}</Typography>
                            <Chip
                              label={pred.class}
                              color={getSeverityColor(pred.class)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          <Typography variant="body2">
                            {Math.round(pred.confidence * 100)}% confidence
                          </Typography>
                        </ResultItem>
                      ))}
                    </Paper>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Detection Time
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      {detectionResult.time.toFixed(2)} seconds
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Inference ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {detectionResult.inference_id}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default AccidentDetection;