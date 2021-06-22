/* eslint-disable */
import { registerInstance as __stencil_registerInstance, attachShadow as __stencil_attachShadow } from "@stencil/core/internal/client";
import { Host, h } from "@stencil/core/internal/client";
import { FunctionalCompOne, FunctionalCompTwo } from './FunctionalComponent';
import basicComponentStyle from "./basic-component.css?tag=basic-component&encapsulation=shadow";
export const BasicComponent = class extends HTMLElement {
  constructor() {
    super();
    this.__registerHost();
    __stencil_attachShadow(this);
  }
  render() {
    const FunctionalCompExternalToComponentInSameFile = ({ name }) => (h("h1", { class: "text-yellow-400" }, "I'm in the same file as component, but outside decorator! Hello, ", name, "!"));
    return (h(Host, null, h("div", { class: "flex flex-col-reverse" }, h(FunctionalCompExternalToComponentInSameFile, { name: 'world' }), h(FunctionalCompOne, { name: 'one' }), h(FunctionalCompTwo, { name: 'two' }), h("slot", null))));
  }
  static get style() { return basicComponentStyle; }
};
