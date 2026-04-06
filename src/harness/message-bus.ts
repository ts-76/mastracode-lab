/**
 * In-memory message bus for inter-agent communication within a team.
 * Uses EventEmitter for lightweight pub/sub — no file I/O needed.
 */
import { EventEmitter } from 'events';
import type { TeamMessage } from './types.js';

export class MessageBus extends EventEmitter {
  private messages: TeamMessage[] = [];

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
    // Check for existing messages first
    const existing = this.messages.find(
      m => (m.toMemberId === memberId || m.toMemberId === 'broadcast') && m.timestamp > Date.now() - timeoutMs,
    );
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

      const handler = (msg: TeamMessage) => {
        cleanup();
        resolve(msg);
      };

      const broadcastHandler = (msg: TeamMessage) => {
        cleanup();
        resolve(msg);
      };

      this.on(`message:${memberId}`, handler);
      this.on('message:broadcast', broadcastHandler);
    });
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
    this.removeAllListeners();
  }
}
