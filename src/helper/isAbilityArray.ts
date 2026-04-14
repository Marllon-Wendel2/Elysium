export function isAbilityArray(value: unknown): value is Ability[] {
  return (
    Array.isArray(value) &&
    value.every(
      (a) =>
        typeof a === 'object' && a !== null && 'trigger' in a && 'effect' in a,
    )
  );
}
