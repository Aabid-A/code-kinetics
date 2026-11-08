// The two motion contracts every template shares. Both endpoint trees and the tests read them from here.

// One spring for every mapped piece in every template (DESIGN.md "Motion contract").
export const morphSpring = {
  type: "spring", stiffness: 200, damping: 20, mass: 0.8,
} as const;

// The shared layout identity of a mapped piece: the same in the code and in the component, so Motion can move
// the piece between them. Reference text left behind in the code never receives one.
export function sharedIdentity(templateId: string, part: string) {
  return `${templateId}:${part}`;
}
