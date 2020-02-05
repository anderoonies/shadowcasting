import React, { Component } from "react";

export default class Dpad extends Component {
  constructor({ handlers }) {
    super();
    this.handlers = handlers;
  }

  click(code) {
    switch (code) {
      case 0:
        return this.handlers.ul && this.handlers.ul();
      case 1:
        return this.handlers.u && this.handlers.u();
      case 2:
        return this.handlers.ur && this.handlers.ur();
      case 3:
        return this.handlers.l && this.handlers.l();
      case 4:
        break;
      case 5:
        return this.handlers.r && this.handlers.r();
      case 6:
        return this.handlers.dl && this.handlers.dl();
      case 7:
        return this.handlers.d && this.handlers.d();
      case 8:
        return this.handlers.dr && this.handlers.dr();
      default:
        return;
    }
  }

  render() {
    return (
      <div className="dpad">
        <div className="dpad-row">
          <button
            onClick={() => {
              return this.click(0);
            }}
          >
            ↖️
          </button>
          <button
            onClick={() => {
              return this.click(1);
            }}
          >
            ⬆️
          </button>
          <button
            onClick={() => {
              return this.click(2);
            }}
          >
            ↗️
          </button>
        </div>
        <div className="dpad-row">
          <button
            onClick={() => {
              return this.click(3);
            }}
          >
            ⬅️
          </button>
          <span className="space"></span>
          <button
            onClick={() => {
              return this.click(5);
            }}
          >
            ➡️
          </button>
        </div>
        <div className="dpad-row">
          <button
            onClick={() => {
              return this.click(6);
            }}
          >
            ↙️
          </button>
          <button
            onClick={() => {
              return this.click(7);
            }}
          >
            ⬇️
          </button>
          <button
            onClick={() => {
              return this.click(8);
            }}
          >
            ↘️
          </button>
        </div>
      </div>
    );
  }
}
