import React from "react";
import { dertet } from "../api";
import appIcon from "../assets/icon.png";

export function TitleBar() {
  return (
    <div className="titlebar">
      <img src={appIcon} alt="" className="titlebar-icon" />
      <div className="titlebar-title">Dertet Harness</div>
      <div className="titlebar-spacer" />
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => dertet().window.minimize()}>
          &#8211;
        </button>
        <button className="titlebar-btn" onClick={() => dertet().window.maximizeToggle()}>
          &#9633;
        </button>
        <button className="titlebar-btn close" onClick={() => dertet().window.close()}>
          &#10005;
        </button>
      </div>
    </div>
  );
}
