/* eslint-disable */
import { h } from "@stencil/core";
export const FunctionalCompOne = ({ name }) => (h("h1", { class: "text-indigo-700" },
  "This is a functional one, hello, human ",
  name,
  "!"));
export const FunctionalCompTwo = ({ name }) => {
  const styles = {
    'text-indigo-700': name === 'hello',
    'text-indigo-500': name === 'world'
  };
  return (h("h1", { class: styles }, "I am functional two!"));
};
