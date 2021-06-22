/* eslint-disable */
import { registerInstance as __stencil_registerInstance } from "@stencil/core";
import { Component, Host, h, Prop } from '@stencil/core';
import basicComponentStyle from "./basic-component.css?tag=basic-component&encapsulation=shadow";
export const BasicComponent = class {
  constructor(hostRef) {
    __stencil_registerInstance(this, hostRef);
  }
  render() {
    const conditionalStyles = {
      'flex flex-col': true,
      'bg-red-50': this.inputProp,
      'bg-green-50': !this.inputProp,
    };
    return (h(Host, null, h("div", { class: conditionalStyles }, h("slot", null))));
  }
};
BasicComponent.style = basicComponentStyle;
