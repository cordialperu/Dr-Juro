import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Forzar dark mode antes de renderizar
document.documentElement.classList.add('dark');
document.documentElement.style.colorScheme = 'dark';

createRoot(document.getElementById("root")!).render(<App />);
