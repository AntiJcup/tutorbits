// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

export interface ITextRange {
  readonly start: number;
  readonly end: number;
  readonly length: number;
  contains(position: number): boolean;
}

export class TextRange implements ITextRange {
  public static readonly empty = TextRange.fromBounds(0, 0);

  public readonly start: number;
  public readonly length: number;

  constructor(start: number, length: number) {
    if (start < 0) {
      throw new Error('start must be non-negative');
    }
    if (length < 0) {
      throw new Error('length must be non-negative');
    }
    this.start = start;
    this.length = length;
  }

  public static fromBounds(start: number, end: number) {
    return new TextRange(start, end - start);
  }

  public get end(): number {
    return this.start + this.length;
  }

  public contains(position: number): boolean {
    return position >= this.start && position < this.end;
  }
}

export interface ITextRangeCollection<T> extends ITextRange {
  count: number;
  getItemAt(index: number): T;
  getItemAtPosition(position: number): number;
  getItemContaining(position: number): number;
}

export class TextRangeCollection<T extends ITextRange> implements ITextRangeCollection<T> {
  private items: T[];

  constructor(items: T[]) {
    this.items = items;
  }

  public get start(): number {
    return this.items.length > 0 ? this.items[0].start : 0;
  }

  public get end(): number {
    return this.items.length > 0 ? this.items[this.items.length - 1].end : 0;
  }

  public get length(): number {
    return this.end - this.start;
  }

  public get count(): number {
    return this.items.length;
  }

  public contains(position: number) {
    return position >= this.start && position < this.end;
  }

  public getItemAt(index: number): T {
    if (index < 0 || index >= this.items.length) {
      throw new Error('index is out of range');
    }
    return this.items[index] as T;
  }

  public getItemAtPosition(position: number): number {
    if (this.count === 0) {
      return -1;
    }
    if (position < this.start) {
      return -1;
    }
    if (position >= this.end) {
      return -1;
    }

    let min = 0;
    let max = this.count - 1;

    while (min <= max) {
      const mid = Math.floor(min + (max - min) / 2);
      const item = this.items[mid];

      if (item.start === position) {
        return mid;
      }

      if (position < item.start) {
        max = mid - 1;
      } else {
        min = mid + 1;
      }
    }
    return -1;
  }

  public getItemContaining(position: number): number {
    if (this.count === 0) {
      return -1;
    }
    if (position < this.start) {
      return -1;
    }
    if (position > this.end) {
      return -1;
    }

    let min = 0;
    let max = this.count - 1;

    while (min <= max) {
      const mid = Math.floor(min + (max - min) / 2);
      const item = this.items[mid];

      if (item.contains(position)) {
        return mid;
      }
      if (mid < this.count - 1 && item.end <= position && position < this.items[mid + 1].start) {
        return -1;
      }

      if (position < item.start) {
        max = mid - 1;
      } else {
        min = mid + 1;
      }
    }
    return -1;
  }
}
