import { beforeEach, describe, expect, it, vi } from 'vitest';

const afterMock = vi.fn();
const drainMock = vi.fn();

vi.mock('next/server', () => ({ after: (fn: () => Promise<void>) => afterMock(fn) }));
vi.mock('@/core/infrastructure/prisma-client', () => ({ prisma: {} }));
vi.mock('@/core/infrastructure/jobs/job-runner', () => ({ drainJobs: (...args: unknown[]) => drainMock(...args) }));

async function loadFresh() {
  vi.resetModules();
  return import('@/core/infrastructure/jobs/kick-drain');
}

describe('kickJobDrain', () => {
  beforeEach(() => {
    afterMock.mockReset();
    drainMock.mockReset();
    drainMock.mockResolvedValue({ claimed: 0 });
    vi.useRealTimers();
  });

  it('schedules a drain after the response', async () => {
    const { kickJobDrain } = await loadFresh();
    kickJobDrain('test');
    expect(afterMock).toHaveBeenCalledTimes(1);
    await afterMock.mock.calls[0][0]();
    expect(drainMock).toHaveBeenCalledTimes(1);
  });

  it('throttles bursts but lets forced kicks through', async () => {
    const { kickJobDrain } = await loadFresh();
    kickJobDrain('checkin');
    kickJobDrain('checkin');
    kickJobDrain('checkin');
    expect(afterMock).toHaveBeenCalledTimes(1);
    kickJobDrain('sync-now', { force: true });
    expect(afterMock).toHaveBeenCalledTimes(2);
  });

  it('kicks again once the throttle window has passed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'));
    const { kickJobDrain } = await loadFresh();
    kickJobDrain('checkin');
    vi.setSystemTime(new Date('2026-10-25T12:00:16Z'));
    kickJobDrain('checkin');
    expect(afterMock).toHaveBeenCalledTimes(2);
  });

  it('never throws when called outside a request scope', async () => {
    const { kickJobDrain } = await loadFresh();
    afterMock.mockImplementation(() => {
      throw new Error('after() called outside a request scope');
    });
    expect(() => kickJobDrain('script')).not.toThrow();
  });

  it('swallows drain failures so a check-in never fails because of Sympla', async () => {
    const { kickJobDrain } = await loadFresh();
    drainMock.mockRejectedValue(new Error('db down'));
    kickJobDrain('checkin', { force: true });
    await expect(afterMock.mock.calls[0][0]()).resolves.toBeUndefined();
  });
});
