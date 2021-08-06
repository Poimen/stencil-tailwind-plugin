/* eslint-disable */
import { registerInstance as __stencil_registerInstance } from "@stencil/core";
import { Component, Host, h } from '@stencil/core';
import modeComponentIosStyle from "./mode-component.ios.css?tag=mode-component&mode=ios&encapsulation=shadow";
import modeComponentMdStyle from "./mode-component.md.scss?tag=mode-component&mode=md&encapsulation=shadow";
export const ModeComponent = class {
  constructor(hostRef) {
    __stencil_registerInstance(this, hostRef);
  }
  render() {
    return (h(Host, null, h("div", { class: "flex flex-row-reverse" }, h("slot", null))));
  }
};
ModeComponent.style = {
  ios: modeComponentIosStyle,
  md: modeComponentMdStyle
};
