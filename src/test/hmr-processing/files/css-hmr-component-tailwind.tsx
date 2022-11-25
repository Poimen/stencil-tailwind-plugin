/* eslint-disable */
import { registerInstance as __stencil_registerInstance } from "@stencil/core";
import { Component, Host, h } from '@stencil/core';
import cssHmrComponentStyle from "./style.css?tag=style&encapsulation=shadow";
export const CssHmrComponent = class {
  constructor(hostRef) {
    __stencil_registerInstance(this, hostRef);
  }
  render() {
    return (h(Host, null, h("div", { class: "flex flex-col bg-[#343da3] text-[3em] text-[#dedede] w-6/12 transform transition duration-500 hover:scale-110" }, h("slot", null))));
  }
};
CssHmrComponent.style = cssHmrComponentStyle;
