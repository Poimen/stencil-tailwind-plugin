/* eslint-disable */
import { registerInstance as __stencil_registerInstance } from "@stencil/core";
import { Component, Host, h } from '@stencil/core';
import basicComponentStyle from "./basic-component.css?tag=basic-component&encapsulation=shadow";
export const BasicComponent = class {
  constructor(hostRef) {
    __stencil_registerInstance(this, hostRef);
  }
  render() {
    return (h(Host, null, h("slot", null)));
  }
};
BasicComponent.style = basicComponentStyle;
