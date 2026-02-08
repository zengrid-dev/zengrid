import { Page } from '@playwright/test';

/**
 * Event testing utilities for ZenGrid
 *
 * Helpers for capturing and asserting grid events
 */

export interface EventCapture {
  name: string;
  data: any;
  timestamp: number;
}

/**
 * Event listener that captures all events
 */
export class EventListener {
  private events: EventCapture[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start listening for events
   */
  async start(eventNames: string[] = []) {
    await this.page.evaluate((names) => {
      // @ts-ignore
      window.__eventCaptures = [];

      const allEvents = names.length > 0 ? names : [
        'cell:click', 'cell:doubleClick', 'cell:contextMenu',
        'cell:change', 'cell:beforeChange', 'cell:afterChange',
        'selection:change', 'selection:start', 'selection:end',
        'edit:start', 'edit:end', 'edit:commit', 'edit:cancel',
        'scroll', 'scroll:start', 'scroll:end',
        'sort:change', 'sort:beforeSort', 'sort:afterSort',
        'filter:change', 'filter:beforeFilter', 'filter:afterFilter',
        'focus:change', 'focus:in', 'focus:out',
        'key:down', 'key:up',
        'copy', 'cut', 'paste',
        'render:start', 'render:end',
        'data:load', 'data:change',
        'column:resize', 'column:move', 'column:hide', 'column:show',
        'column:dragStart', 'column:drag', 'column:dragEnd',
        'header:click', 'header:doubleClick', 'header:contextMenu',
        'loading:start', 'loading:end',
      ];

      allEvents.forEach((eventName) => {
        // @ts-ignore
        window.grid?.on(eventName, (data: any) => {
          // @ts-ignore
          window.__eventCaptures.push({
            name: eventName,
            data,
            timestamp: Date.now(),
          });
        });
      });
    }, eventNames);
  }

  /**
   * Get all captured events
   */
  async getEvents(): Promise<EventCapture[]> {
    return this.page.evaluate(() => {
      // @ts-ignore
      return window.__eventCaptures || [];
    });
  }

  /**
   * Get events by name
   */
  async getEventsByName(eventName: string): Promise<EventCapture[]> {
    const events = await this.getEvents();
    return events.filter((e) => e.name === eventName);
  }

  /**
   * Wait for specific event
   */
  async waitForEvent(eventName: string, timeout = 1000): Promise<EventCapture> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const events = await this.getEventsByName(eventName);
      if (events.length > 0) {
        return events[events.length - 1];
      }
      await this.page.waitForTimeout(50);
    }

    throw new Error(`Event ${eventName} not fired within ${timeout}ms`);
  }

  /**
   * Assert event was fired
   */
  async assertEventFired(eventName: string): Promise<boolean> {
    const events = await this.getEventsByName(eventName);
    return events.length > 0;
  }

  /**
   * Assert event count
   */
  async assertEventCount(eventName: string, expectedCount: number): Promise<boolean> {
    const events = await this.getEventsByName(eventName);
    return events.length === expectedCount;
  }

  /**
   * Assert event order
   */
  async assertEventOrder(eventNames: string[]): Promise<boolean> {
    const events = await this.getEvents();
    const filteredEvents = events.filter((e) => eventNames.includes(e.name));

    if (filteredEvents.length !== eventNames.length) {
      return false;
    }

    for (let i = 0; i < eventNames.length; i++) {
      if (filteredEvents[i].name !== eventNames[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clear captured events
   */
  async clear() {
    await this.page.evaluate(() => {
      // @ts-ignore
      window.__eventCaptures = [];
    });
  }

  /**
   * Stop listening
   */
  async stop() {
    await this.page.evaluate(() => {
      // @ts-ignore
      delete window.__eventCaptures;
    });
  }
}

/**
 * Wait for multiple events in sequence
 */
export async function waitForEventSequence(
  page: Page,
  eventNames: string[],
  timeout = 5000
): Promise<EventCapture[]> {
  const listener = new EventListener(page);
  await listener.start(eventNames);

  const startTime = Date.now();
  const captured: EventCapture[] = [];

  for (const eventName of eventNames) {
    const remaining = timeout - (Date.now() - startTime);
    if (remaining <= 0) {
      throw new Error(`Timeout waiting for event sequence`);
    }

    const event = await listener.waitForEvent(eventName, remaining);
    captured.push(event);
  }

  await listener.stop();
  return captured;
}

/**
 * Wait for any of the events
 */
export async function waitForAnyEvent(
  page: Page,
  eventNames: string[],
  timeout = 1000
): Promise<EventCapture> {
  const listener = new EventListener(page);
  await listener.start(eventNames);

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (const eventName of eventNames) {
      const events = await listener.getEventsByName(eventName);
      if (events.length > 0) {
        await listener.stop();
        return events[events.length - 1];
      }
    }
    await page.waitForTimeout(50);
  }

  await listener.stop();
  throw new Error(`None of the events fired within ${timeout}ms`);
}

/**
 * Capture events during action
 */
export async function captureEventsDuring(
  page: Page,
  action: () => Promise<void>,
  eventNames: string[] = []
): Promise<EventCapture[]> {
  const listener = new EventListener(page);
  await listener.start(eventNames);
  await action();
  const events = await listener.getEvents();
  await listener.stop();
  return events;
}

/**
 * Assert event data contains
 */
export async function assertEventData(
  event: EventCapture,
  expectedData: Partial<any>
): boolean {
  if (!event.data) return false;

  for (const [key, value] of Object.entries(expectedData)) {
    if (event.data[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Mock event for testing
 */
export async function emitMockEvent(page: Page, eventName: string, data: any = {}) {
  await page.evaluate(({ name, eventData }) => {
    // @ts-ignore
    window.grid?.emit?.(name, eventData);
  }, { name: eventName, eventData: data });
}

/**
 * Assert event was NOT fired
 */
export async function assertEventNotFired(page: Page, eventName: string): Promise<boolean> {
  const listener = new EventListener(page);
  await listener.start([eventName]);
  await page.waitForTimeout(200);
  const fired = await listener.assertEventFired(eventName);
  await listener.stop();
  return !fired;
}
