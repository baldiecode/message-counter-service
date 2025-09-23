export class ProcessWebhookCommand {
  constructor(
    public readonly messageId: string,
    public readonly accountId: string,
    public readonly createdAt: string,
    public readonly metadata: Record<string, any>,
  ) {}
}
