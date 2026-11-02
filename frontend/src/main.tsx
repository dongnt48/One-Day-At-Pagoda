import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./app/styles.css";
void fetch('/api/visit',{method:'POST',credentials:'same-origin',keepalive:true}).catch(()=>{});
createRoot(document.getElementById("root")!).render(<App />);
