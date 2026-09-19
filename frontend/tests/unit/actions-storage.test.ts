import { describe, expect, it } from 'vitest';

import {
  ACTIONS_STORAGE_PREFIX,
  actionsStorageKey,
  readStoredActions,
  writeStoredActions,
  type ActionsStorage,
} from '@/lib/actions/storage';
import type { CompanyActions } from '@/lib/actions/types';

/** In-memory stand-in for `localStorage`. */
function memoryStorage(initial: Record<string, string> = {}): ActionsStorage & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const RESULT: CompanyActions = {
  companyId: 'COMP_0001',
  month: '2026-08',
  mode: 'gateway',
  actions: [
    {
      title: 'Contrata la línea de crédito de 45.000 € a 12 meses',
      detail: 'Cubre los pagos de dos meses y paga menos intereses.',
      target: 'advisor',
    },
  ],
};

describe('the browser copy of the actions', () => {
  it('keys one entry per company under a versioned prefix', () => {
    expect(actionsStorageKey('COMP_0001')).toBe(
      `${ACTIONS_STORAGE_PREFIX}COMP_0001`,
    );
  });

  it('writes a model answer and reads it back for the same close', () => {
    const storage = memoryStorage();
    expect(writeStoredActions(storage, RESULT)).toBe(true);
    expect(readStoredActions(storage, 'COMP_0001', '2026-08')).toEqual(RESULT);
  });

  it('never keeps a demo answer', () => {
    const storage = memoryStorage();
    expect(writeStoredActions(storage, { ...RESULT, mode: 'mock' })).toBe(
      false,
    );
    expect(storage.data.size).toBe(0);
  });

  it('misses when the close moved on', () => {
    const storage = memoryStorage();
    writeStoredActions(storage, RESULT);
    expect(readStoredActions(storage, 'COMP_0001', '2026-09')).toBeNull();
  });

  it('misses on another company, a broken entry or a foreign shape', () => {
    const key = actionsStorageKey('COMP_0001');
    expect(
      readStoredActions(
        memoryStorage({ [key]: '{oops' }),
        'COMP_0001',
        '2026-08',
      ),
    ).toBeNull();
    expect(
      readStoredActions(
        memoryStorage({ [key]: JSON.stringify({ hello: 'world' }) }),
        'COMP_0001',
        '2026-08',
      ),
    ).toBeNull();
    expect(
      readStoredActions(
        memoryStorage({
          [key]: JSON.stringify({ ...RESULT, companyId: 'COMP_0002' }),
        }),
        'COMP_0001',
        '2026-08',
      ),
    ).toBeNull();
    expect(
      readStoredActions(memoryStorage(), 'COMP_0001', '2026-08'),
    ).toBeNull();
  });

  it('treats a storage that throws as empty, both ways', () => {
    const broken: ActionsStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(readStoredActions(broken, 'COMP_0001', '2026-08')).toBeNull();
    expect(writeStoredActions(broken, RESULT)).toBe(false);
  });
});
