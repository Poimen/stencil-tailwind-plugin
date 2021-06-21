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
    return (h(Host, null, h("div", { class: "other-styles" }, h("slot", null))));
  }
  static get anotherGetter() { return "this should not change"; }
  static get style() { return basicComponentStyle; }
};
