export interface ProductPresentation {
  meta: string;
  image: string;
}

const presentation = [
  "2 weeks · clear action plan",
  "90 min · leadership session",
  "Project · customer research",
  "Quarterly · planning support",
  "Project · process assessment",
  "Project · setup and onboarding",
  "Project · data review",
  "Project · dashboard and handover",
  "2 weeks · workflow improvements",
  "Monthly · analytics guidance",
  "Half-day · team workshop",
  "Monthly · coaching sessions",
  "Project · team playbook",
  "1 week · launch guidance",
  "Monthly · advisory session",
];

export const PRODUCTS: Record<string, ProductPresentation> = Object.fromEntries(
  presentation.map((meta, index) => [
    `product_${String(index + 1).padStart(2, "0")}`,
    { meta, image: "/aster-advisory.webp" },
  ]),
);

export function presentationFor(productId: string): ProductPresentation | undefined {
  return PRODUCTS[productId];
}
