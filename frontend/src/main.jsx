import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./Components/ErrorBoundary.jsx"; // ✅ Import ErrorBoundary
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
