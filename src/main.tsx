import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// StrictMode removido para reduzir renderizações duplas em dispositivos mobile
createRoot(document.getElementById("root")!).render(<App />);
