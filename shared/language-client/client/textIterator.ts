// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

import { Position, Range } from 'monaco-languageclient/lib/services';
import * as monaco from 'monaco-editor-core';

export interface ITextIterator {
  readonly length: number;
  charCodeAt(index: number): number;
  getText(): string;
}

export class TextIterator implements ITextIterator {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  public charCodeAt(index: number): number {
    if (index >= 0 && index < this.text.length) {
      return this.text.charCodeAt(index);
    }
    return 0;
  }

  public get length(): number {
    return this.text.length;
  }

  public getText(): string {
    return this.text;
  }
}

export class DocumentTextIterator implements ITextIterator {
  public readonly length: number;

  private document: monaco.editor.ITextModel;

  constructor(document: monaco.editor.ITextModel) {
    this.document = document;

    const lastIndex = this.document.getLineCount() - 1;
    const lastLine = this.document.getPositionAt(lastIndex);
    const end = Position.create(lastIndex, lastLine.column);
    this.length = this.document.getOffsetAt({
      lineNumber: end.line,
      column: end.character
    });
  }

  public charCodeAt(index: number): number {
    const position = this.document.getPositionAt(index);
    return this.document.getValue().substr(index, 1).charCodeAt(0);
  }

  public getText(): string {
    return this.document.getValue();
  }
}
