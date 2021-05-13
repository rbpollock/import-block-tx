import React from "react";
import ReactDOM from "react-dom";
import ButtonLoader from "./ButtonLoader/index";

import "./styles.css";

function App() {
  return (
    <div className="App">
      <ButtonLoader />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
