export class GameRules {
  // static canExecute(state: any, action: any): boolean {
  //   return true;
  // }

  static isValidSlotChoice(front: number, back: number, max: number): boolean {
    if (!Number.isInteger(front) || !Number.isInteger(back)) return false;
    if (front < 0 || back < 0) return false;

    return front + back === max;
  }
}
