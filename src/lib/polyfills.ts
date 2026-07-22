// Polyfills pour Safari 15.0-15.3 et anciens navigateurs
// Next.js 16 + React 19 nécessitent ces APIs

if (typeof window !== 'undefined') {
  // structuredClone - requis par React 19 et Next.js
  if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = function structuredClone(value: any) {
      return JSON.parse(JSON.stringify(value));
    };
  }

  // Array.prototype.at() - Safari < 15.4
  if (!Array.prototype.at) {
    Array.prototype.at = function at(index: number) {
      const len = this.length;
      const relativeIndex = index < 0 ? len + index : index;
      if (relativeIndex < 0 || relativeIndex >= len) return undefined;
      return this[relativeIndex];
    };
  }

  // String.prototype.at() - Safari < 15.4
  if (!String.prototype.at) {
    String.prototype.at = function at(index: number) {
      const len = this.length;
      const relativeIndex = index < 0 ? len + index : index;
      if (relativeIndex < 0 || relativeIndex >= len) return undefined;
      return this[relativeIndex];
    };
  }

  // Object.hasOwn() - Safari < 15.4
  if (typeof Object.hasOwn !== 'function') {
    Object.hasOwn = function hasOwn(obj: any, prop: string | symbol) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }

  // Array.prototype.findLast() - Safari < 15.4
  if (!Array.prototype.findLast) {
    Array.prototype.findLast = function findLast(callback: Function, thisArg?: any) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (callback.call(thisArg, this[i], i, this)) return this[i];
      }
      return undefined;
    };
  }

  // Array.prototype.findLastIndex() - Safari < 15.4
  if (!Array.prototype.findLastIndex) {
    Array.prototype.findLastIndex = function findLastIndex(callback: Function, thisArg?: any) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (callback.call(thisArg, this[i], i, this)) return i;
      }
      return -1;
    };
  }

  // Array.prototype.toReversed() - Safari < 16
  if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function toReversed() {
      return [...this].reverse();
    };
  }

  // Array.prototype.toSorted() - Safari < 16
  if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function toSorted(compareFn?: (a: any, b: any) => number) {
      return [...this].sort(compareFn);
    };
  }

  // Promise.any() - Safari < 14
  if (typeof Promise.any !== 'function') {
    Promise.any = function any(promises: Iterable<Promise<any>>) {
      return new Promise((resolve, reject) => {
        const errors: any[] = [];
        let count = 0;
        let resolved = false;
        for (const p of promises) {
          const i = count;
          count++;
          Promise.resolve(p).then(
            (val) => { if (!resolved) { resolved = true; resolve(val); } },
            (err) => { errors[i] = err; if (errors.length === count && !resolved) reject(new AggregateError(errors, 'All promises were rejected')); }
          );
        }
        if (count === 0) reject(new AggregateError([], 'All promises were rejected'));
      });
    };
  }

  // queueMicrotask - Safari < 12 (rare mais safe)
  if (typeof globalThis.queueMicrotask !== 'function') {
    globalThis.queueMicrotask = function queueMicrotask(fn: () => void) {
      Promise.resolve().then(fn);
    };
  }

  // crypto.randomUUID() - Safari < 15.4
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
    (crypto as any).randomUUID = function randomUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
  }

  // AggregateError - Safari < 14
  if (typeof globalThis.AggregateError !== 'function') {
    // @ts-ignore
    globalThis.AggregateError = class AggregateError extends Error {
      errors: any[];
      constructor(errors: any[], message?: string) {
        super(message);
        this.name = 'AggregateError';
        this.errors = errors;
      }
    };
  }
}