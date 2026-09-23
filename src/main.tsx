
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "mapbox-gl/dist/mapbox-gl.css";
  import "./shared/styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  
