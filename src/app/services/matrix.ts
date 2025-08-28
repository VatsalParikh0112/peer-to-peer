// src/app/services/matrix.service.ts
import { Injectable } from '@angular/core';
import * as matrixcs from 'matrix-js-sdk';
import { MatrixClient, Room, IndexedDBStore, MemoryStore } from 'matrix-js-sdk';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatrixService {
  public client!: MatrixClient;
  public incomingCall$ = new Subject<any>();

  constructor() { }

  initializeClient(homeserverUrl: string): MatrixClient {
    // This logic correctly handles all browser environments
    const isIndexedDbSupported = !!window.indexedDB;
    console.log("Is IndexedDB supported?", isIndexedDbSupported);

    this.client = matrixcs.createClient({
      baseUrl: homeserverUrl,
      // Use IndexedDB for persistent storage, but fall back to MemoryStore if it's blocked.
      store: isIndexedDbSupported ? new IndexedDBStore({
        indexedDB: window.indexedDB,
        dbName: 'matrix-video-call-store',
      }) : new MemoryStore(),
    });

    this.client.on('Call.incoming' as any, (call: any) => {
      this.incomingCall$.next(call);
    });
    
    return this.client;
  }
  
  async loginWithPassword(userId: string, password: string) {
    return this.client.login('m.login.password', { user: userId, password: password });
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.client.stopClient();
      await this.client.clearStores();
    }
  }

  async start() {
    return new Promise<void>((resolve) => {
      this.client.on('sync' as any, (state: string) => {
        if (state === 'PREPARED') resolve();
      });
      this.client.startClient({ initialSyncLimit: 10 });
    });
  }

  async placeCallByRoomId(roomId: string) {
    const room = this.client.getRoom(roomId);
    if (!room) {
      console.error(`Error: You don't appear to be a member of the room ${roomId}`);
      return null;
    }

    console.log(`Placing call directly in room ${roomId}`);
    const call = matrixcs.createNewMatrixCall(this.client, roomId);
    if (call) {
      call.placeVideoCall();
    }
    return call;
  }
}