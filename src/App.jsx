import { BrowserRouter, Route, Routes } from "react-router-dom";
import Playground from "./Playground.jsx";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Playground />} />
      </Routes>
    </BrowserRouter>
  );
}
