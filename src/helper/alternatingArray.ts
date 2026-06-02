export function alternatingArrays<T>(arrayOne: T[], arrayTwo: T[]): T[] {
  const result: T[] = [];

  for (let i = 0; i < Math.max(arrayOne.length, arrayTwo.length); i++) {
    if (arrayOne[i] !== undefined) result.push(arrayOne[i]);
    if (arrayTwo[i] !== undefined) result.push(arrayTwo[i]);
  }

  return result;
}
