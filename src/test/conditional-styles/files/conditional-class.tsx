/* eslint-disable */
import { registerInstance as __stencil_registerInstance, attachShadow as __stencil_attachShadow } from "@stencil/core/internal/client";
import { Host, h } from "@stencil/core/internal/client";
import basicComponentStyle from "./basic-component.css?tag=basic-component&encapsulation=shadow";
export const BasicComponent = class extends HTMLElement {
  constructor() {
    super();
    this.__registerHost();
    __stencil_attachShadow(this);
  }
  render() {
    const conditionalStyles = {
      'flex flex-col': true,
      'bg-red-50': this.inputProp,
      'bg-green-50': !this.inputProp,
    };
    return (h(Host, null, h("div", { class: conditionalStyles }, h("slot", null))));
  }
  static get style() { return basicComponentStyle; }
};
