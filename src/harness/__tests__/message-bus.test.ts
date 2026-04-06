import { describe, it, expect } from 'vitest';
import { MessageBus } from '../message-bus.js';
import type { TeamMessage } from '../types.js';

describe('MessageBus', () => {
  it('should deliver a direct message via event', () => {
    const bus = new MessageBus();
    const received: TeamMessage[] = [];

    bus.on('message:member-b', (msg: TeamMessage) => {
      received.push(msg);
    });

    bus.send({
      fromMemberId: 'member-a',
      toMemberId: 'member-b',
      content: 'hello',
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
    expect(received[0].content).toBe('hello');
  });

  it('should broadcast messages to all broadcast listeners', () => {
    const bus = new MessageBus();
    const received: TeamMessage[] = [];

    bus.on('message:broadcast', (msg: TeamMessage) => {
      received.push(msg);
    });

    bus.send({
      fromMemberId: 'member-c',
      toMemberId: 'broadcast',
      content: 'hello all',
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
    expect(received[0].content).toBe('hello all');
  });

  it('should emit generic "message" event for all messages', () => {
    const bus = new MessageBus();
    const received: TeamMessage[] = [];

    bus.on('message', (msg: TeamMessage) => {
      received.push(msg);
    });

    bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'direct', timestamp: 1 });
    bus.send({ fromMemberId: 'a', toMemberId: 'broadcast', content: 'broadcast', timestamp: 2 });

    expect(received).toHaveLength(2);
  });

  it('should store message history in getAllMessages', () => {
    const bus = new MessageBus();

    bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'msg1', timestamp: 1000 });
    bus.send({ fromMemberId: 'a', toMemberId: 'broadcast', content: 'msg2', timestamp: 2000 });

    const all = bus.getAllMessages();
    expect(all).toHaveLength(2);
    expect(all[0].content).toBe('msg1');
    expect(all[1].content).toBe('msg2');
  });

  it('should filter messages by recipient via getMessagesFor', () => {
    const bus = new MessageBus();

    bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'ab', timestamp: 1000 });
    bus.send({ fromMemberId: 'a', toMemberId: 'c', content: 'ac', timestamp: 2000 });
    bus.send({ fromMemberId: 'a', toMemberId: 'broadcast', content: 'all', timestamp: 3000 });

    const forB = bus.getMessagesFor('b');
    expect(forB).toHaveLength(2); // direct to b + broadcast
    expect(forB.map(m => m.content)).toContain('ab');
    expect(forB.map(m => m.content)).toContain('all');
  });

  it('should filter messages by sender via getMessagesFrom', () => {
    const bus = new MessageBus();

    bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'ab', timestamp: 1000 });
    bus.send({ fromMemberId: 'b', toMemberId: 'a', content: 'ba', timestamp: 2000 });

    const fromA = bus.getMessagesFrom('a');
    expect(fromA).toHaveLength(1);
    expect(fromA[0].content).toBe('ab');
  });

  it('should clear all messages and listeners', () => {
    const bus = new MessageBus();
    const received: TeamMessage[] = [];

    bus.on('message', (msg: TeamMessage) => { received.push(msg); });

    bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'hello', timestamp: 1000 });
    bus.clear();

    // After clear, messages array is empty and listeners are removed
    expect(bus.getAllMessages()).toHaveLength(0);
    expect(bus.listenerCount('message')).toBe(0);
  });

  it('should resolve receive() promise for existing messages', async () => {
    const bus = new MessageBus();

    bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'existing', timestamp: Date.now() });

    const msg = await bus.receive('b', 100);
    expect(msg.content).toBe('existing');
  });

  it('should resolve receive() promise for incoming messages', async () => {
    const bus = new MessageBus();

    const promise = bus.receive('b', 1000);

    // Simulate delayed send
    setTimeout(() => {
      bus.send({ fromMemberId: 'a', toMemberId: 'b', content: 'delayed', timestamp: Date.now() });
    }, 10);

    const msg = await promise;
    expect(msg.content).toBe('delayed');
  });

  it('should timeout receive() if no message arrives', async () => {
    const bus = new MessageBus();

    await expect(bus.receive('b', 50)).rejects.toThrow('Message timeout');
  });
});
