import { Component, ContentChild, ViewChild, OnInit } from '@angular/core';
import { TreeModel, NodeMenuItemAction, Ng2TreeSettings, TreeComponent } from 'ng2-tree';
import { editor, IPosition, Range } from 'monaco-editor/esm/vs/editor/editor.api';
import { LocalTransactionLoader, LocalTransactionWriter } from 'shared/Tracer/lib/ts/LocalTransaction';
import { TraceProject, TraceTransaction, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript';
import { TransactionTracker } from 'shared/Tracer/lib/ts/TransactionTracker';
import { debug } from 'util';
import { HttpClient } from '@angular/common/http';
import { MonacoPlayer } from './sub-components/player/monaco.player';
import {
  OnlineTransactionLoader,
  OnlineTransactionRequest,
  OnlineTransactionRequestInfo,
  OnlineTransactionWriter
} from 'shared/Tracer/lib/ts/OnlineTransaction';
import { MonacoRecorder } from './sub-components/recorder/monaco.recorder';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})

export class AppComponent implements OnInit {
  ngOnInit(): void {

  }

  constructor(private http: HttpClient) {

  }
}
