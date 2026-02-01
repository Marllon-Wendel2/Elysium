export class Player {
  constructor(
    public readonly id: string,
    public socketId: string,
    public roomId?: string,
    public name?: string,
  ) {}
}
