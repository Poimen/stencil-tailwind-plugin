/* eslint-disable */
import { registerInstance as __stencil_registerInstance } from "@stencil/core";
import { Component, Host, h, Prop } from '@stencil/core';
import basicComponentStyle from "./basic-component.css?tag=basic-component&encapsulation=shadow";
const FunctionalCompExternalToComponentInSameFile = ({ name }) => (h("h1", { class: "text-yellow-400" }, "I'm in the same file as component, but outside decorator! Hello, ", name, "!"));
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
    return (h(Host, null, h("div", { class: conditionalStyles }, h(FunctionalCompExternalToComponentInSameFile, { name: 'world' }), h("slot", null))));
  }
};
BasicComponent.style = basicComponentStyle;
