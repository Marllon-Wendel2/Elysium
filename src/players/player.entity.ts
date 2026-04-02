export class Player {
  constructor(
    public readonly id: string,
    public socketId: string,
    public roomId?: string,
    public name?: string,
  ) {}

  static fromJSON(data: unknown): Player {
    if (
      typeof data !== 'object' ||
      data === null ||
      !('id' in data) ||
      !('socketId' in data)
    ) {
      throw new Error('Invalid player data');
    }

    const d = data as any;

    return new Player(d.id, d.socketId, d.roomId, d.name);
  }
}
