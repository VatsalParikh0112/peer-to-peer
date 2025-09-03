import { Injectable } from '@angular/core';
import * as matrixcs from 'matrix-js-sdk';
import { MatrixClient, Room, MemoryStore } from 'matrix-js-sdk';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatrixService {
  public client!: MatrixClient;
  public incomingCall = new Subject<any>();
  private homeserverUrl = '';

  constructor() { }

  /**
   * Initialize client with homeserver URL (pre-login)
   */
  initializeClient(homeserverUrl: string): void {
    console.log("Forcing MemoryStore to avoid all storage errors.");
    this.homeserverUrl = homeserverUrl;

    this.client = matrixcs.createClient({
      baseUrl: homeserverUrl,
      store: new MemoryStore(),
    });

    this.client.on('Call.incoming' as any, (call: any) => {
      this.incomingCall.next(call);
    });
  }

  /**
   * Login with password and re-create authenticated client
   */
  async loginWithPassword(userId: string, password: string): Promise<any> {
    try {
      const loginResponse = await this.client.login('m.login.password', {
        user: userId,
        password: password,
      });

      console.log("Login success:", loginResponse);

      this.client = matrixcs.createClient({
        baseUrl: this.homeserverUrl,
        accessToken: loginResponse.access_token,
        userId: loginResponse.user_id,
        deviceId: loginResponse.device_id,
        store: new MemoryStore(),
      });

      this.client.on('Call.incoming' as any, (call: any) => {
        this.incomingCall.next(call);
      });

      return loginResponse;

    } catch (err: any) {
      if (err.httpStatus === 429) {
        const retry = err.data?.retry_after_ms || 5000;
        console.warn(`Rate limited. Retrying after ${retry}ms`);
        await new Promise(res => setTimeout(res, retry));
        return this.loginWithPassword(userId, password); // retry once
      }
      throw err;
    }
  }

  async logout() {
    if (this.client) {
      try {
        await this.client.logout();
      } catch (e) {
        console.warn("Logout error:", e);
      }
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

  async placeCallByUserId(targetUserId: string) {
    let roomId: string | undefined;
    const existingRoom = this.findDirectRoomWithUser(targetUserId);

    if (existingRoom) {
      roomId = existingRoom.roomId;
    } else {
      try {
        const createRoomResponse = await this.client.createRoom({
          is_direct: true,
          invite: [targetUserId],
        });
        roomId = createRoomResponse.room_id;
      } catch (error) {
        console.error("Failed to create room:", error);
        return null;
      }
    }

    if (!roomId) {
      console.error("Could not find or create a room ID to place the call.");
      return null;
    }

    const call = matrixcs.createNewMatrixCall(this.client, roomId);
    if (call) {
      call.placeVideoCall();
    }
    return call;
  }

  async placeCallByRoomId(roomId: string) {
    try {
      const call = matrixcs.createNewMatrixCall(this.client, roomId);
      if (call) {
        call.placeVideoCall();
        return call;
      }
      return null;
    } catch (error) {
      console.error("Failed to place call in room:", error);
      return null;
    }
  }

  private findDirectRoomWithUser(userId: string): Room | undefined {
    const rooms = this.client.getRooms();
    return rooms.find(r => {
      const members = r.getJoinedMembers();
      return members.length === 2 && members.some(m => m.userId === userId);
    });
  }
}
