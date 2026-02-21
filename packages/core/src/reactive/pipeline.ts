import type { PipelinePhase } from './types';
import type { GridStoreImpl } from './store';

export class PipelineRegistry {
  private phases: PipelinePhase[] = [];

  registerPhase(name: string, phase: number, key: string): void {
    const existing = this.phases.find((p) => p.phase === phase);
    if (existing) {
      throw new Error(
        `Pipeline phase ${phase} already registered as "${existing.name}"`,
      );
    }

    const entry: PipelinePhase = { name, phase, key };
    this.phases.push(entry);
    this.phases.sort((a, b) => a.phase - b.phase);
  }

  setupCoreComputeds(store: GridStoreImpl): void {
    const phases = this.phases;

    store.computed(
      'rows.viewIndices',
      () => {
        // Walk phases backward; return first non-undefined pipeline output
        for (let i = phases.length - 1; i >= 0; i--) {
          const val = store.getUnphased(phases[i].key);
          if (val !== undefined) {
            return val as number[];
          }
        }
        // No active pipeline phases — fall back to raw indices
        return store.getUnphased('rows.indices') as number[];
      },
      'core',
      Infinity, // viewIndices is the final derived value
    );

    store.computed(
      'rows.viewCount',
      () => {
        const indices = store.getUnphased('rows.viewIndices') as number[];
        return indices?.length ?? 0;
      },
      'core',
      Infinity,
    );
  }

  getPhases(): PipelinePhase[] {
    return [...this.phases];
  }
}
