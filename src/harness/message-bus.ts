/**
 * In-memory message bus for inter-agent communication within a team.
 * Uses EventEmitter for lightweight pub/sub — no file I/O needed.
 */
import { EventEmitter } from 'events';
import type { TeamMessage } from './types.js';

export class MessageBus extends EventEmitter {
  private messages: TeamMessage[] = [];
  private deliveryCursor = new Map<string, number>();

  constructor() {
    super();
    this.setMaxListeners(100); // team members + tests
  }

  /**
   * Send a message from one member to another (or broadcast).
   * Returns true if the message was delivered to at least one listener.
   */
  send(message: TeamMessage): boolean {
    this.messages.push(message);
    // Emit to specific recipient + broadcast listeners
    this.emit(`message:${message.toMemberId}`, message);
    if (message.toMemberId !== 'broadcast') {
      this.emit('message:broadcast', message);
    }
    this.emit('message', message);
    return true;
  }

  /**
   * Get the next message addressed to a specific member.
   * Returns a promise that resolves when a message arrives.
   */
  async receive(memberId: string, timeoutMs = 30_000): Promise<TeamMessage> {
    const existing = this.dequeue(memberId, timeoutMs);
    if (existing) return existing;

    return new Promise<TeamMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(`message:${memberId}`, handler);
        this.off('message:broadcast', broadcastHandler);
        reject(new Error(`Message timeout for member "${memberId}" after ${timeoutMs}ms`));
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        this.off(`message:${memberId}`, handler);
        this.off('message:broadcast', broadcastHandler);
      };

      const resolveQueued = (msg: TeamMessage) => {
        const nextMessage = this.dequeue(memberId, timeoutMs, msg);
        if (!nextMessage) return;
        cleanup();
        resolve(nextMessage);
      };

      const handler = (msg: TeamMessage) => {
        resolveQueued(msg);
      };

      const broadcastHandler = (msg: TeamMessage) => {
        resolveQueued(msg);
      };

      this.on(`message:${memberId}`, handler);
      this.on('message:broadcast', broadcastHandler);
    });
  }

  private dequeue(memberId: string, timeoutMs: number, incomingMessage?: TeamMessage): TeamMessage | undefined {
    const startIndex = this.deliveryCursor.get(memberId) ?? 0;
    const cutoff = Date.now() - timeoutMs;

    for (let index = startIndex; index < this.messages.length; index++) {
      const message = this.messages[index];
      const isDeliverable = (message.toMemberId === memberId || message.toMemberId === 'broadcast') && message.timestamp > cutoff;
      if (!isDeliverable) continue;
      if (incomingMessage && message !== incomingMessage) continue;

      this.deliveryCursor.set(memberId, index + 1);
      return message;
    }

    return undefined;
  }

  /**
   * Get all messages for a specific member (including broadcasts).
   */
  getMessagesFor(memberId: string): TeamMessage[] {
    return this.messages.filter(m => m.toMemberId === memberId || m.toMemberId === 'broadcast');
  }

  /**
   * Get all messages sent by a specific member.
   */
  getMessagesFrom(memberId: string): TeamMessage[] {
    return this.messages.filter(m => m.fromMemberId === memberId);
  }

  /** Get all messages. */
  getAllMessages(): TeamMessage[] {
    return [...this.messages];
  }

  /** Clear all messages. */
  clear(): void {
    this.messages = [];
    this.deliveryCursor.clear();
    this.removeAllListeners();
  }
}
