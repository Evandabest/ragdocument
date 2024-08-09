import { HoverEffect } from "./ui/card-hover-effect";

export function CardHoverEffectDemo() {
  return (
    <div className="max-w-5xl mx-auto px-8">
      <HoverEffect items={projects} />
    </div>
  );
}
export const projects = [
  {
    title: "Stripe",
    image:
      "https://randomwordgenerator.com/img/picture-generator/53e9d24a4b4faa0df7c5d57bc32f3e7b1d3ac3e45551754c7c2878d59f_640.jpg",
    link: "https://randomwordgenerator.com/img/picture-generator/53e9d24a4b4faa0df7c5d57bc32f3e7b1d3ac3e45551754c7c2878d59f_640.jpg",
  },
  
];
