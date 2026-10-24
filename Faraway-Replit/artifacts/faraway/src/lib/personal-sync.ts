import type { PersonalData } from './personal-data';

export interface PersonalRepository {
  load(userId: string): Promise<PersonalData | null>;
  save(userId: string, data: PersonalData): Promise<void>;
}
export type SyncStatus = { phase: 'idle' | 'loading' | 'saved' | 'saving' | 'load-error' | 'save-error'; error?: string };

// Serial saves prevent a slow older write from overwriting a newer assessment.
// A generation token prevents stale account loads from restoring another user's state.
export class PersonalSync {
  private generation = 0;
  private userId: string | null = null;
  private pending: PersonalData | null = null;
  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  ready = false;
  get hasPending() { return Boolean(this.pending || this.running); }
  constructor(private repository: PersonalRepository, private report: (status: SyncStatus) => void, private delay = 500) {}

  async connect(userId: string, restore: (data: PersonalData | null) => void) {
    this.disconnect();
    this.userId = userId;
    const generation = this.generation;
    this.report({ phase: 'loading' });
    try {
      const data = await this.repository.load(userId);
      if (generation !== this.generation) return;
      restore(data);
      this.ready = true;
      this.report({ phase: 'saved' });
    } catch (error) {
      if (generation === this.generation) this.report({ phase: 'load-error', error: String(error instanceof Error ? error.message : error) });
    }
  }

  changed(data: PersonalData) {
    if (!this.ready) return;
    this.pending = data;
    this.report({ phase: 'saving' });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush().catch(() => { /* reported; pending changes retained for retry */ }); }, this.delay);
  }

  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.running) await this.running;
    if (!this.pending || !this.userId || !this.ready) return;
    const generation = this.generation;
    const userId = this.userId;
    const run = async () => {
      while (this.pending && generation === this.generation) {
        const data = this.pending;
        this.pending = null;
        this.report({ phase: 'saving' });
        try {
          await this.repository.save(userId, data);
        } catch (error) {
          if (generation === this.generation) {
            this.pending ??= data;
            this.report({ phase: 'save-error', error: error instanceof Error ? error.message : String(error) });
          }
          throw error;
        }
      }
      if (generation === this.generation) this.report({ phase: 'saved' });
    };
    const running = run();
    this.running = running;
    try { await running; } finally { if (this.running === running) this.running = null; }
  }

  disconnect() {
    this.generation++;
    this.userId = null;
    this.ready = false;
    this.pending = null;
    this.running = null;
    clearTimeout(this.timer);
  }
}
