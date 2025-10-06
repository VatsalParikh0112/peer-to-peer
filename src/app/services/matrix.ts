import { inject, Injectable } from '@angular/core';
import { MatrixSdkWrapper } from './matrix-sdk.wrapper';
import { MatrixClient, Room, MemoryStore, MatrixCall } from 'matrix-js-sdk';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatrixService {
  public client!: MatrixClient;
  public incomingCall = new Subject<MatrixCall>();
  private homeserverUrl = '';
  private matrixSdk = inject(MatrixSdkWrapper);

  constructor() {}

  initializeClient(homeserverUrl: string): void {
    this.homeserverUrl = homeserverUrl;

    this.client = this.matrixSdk.createClient({
      baseUrl: homeserverUrl,
      store: new MemoryStore(),
    });

    this.client.on('Call.incoming' as any, (call: MatrixCall) => {
      this.incomingCall.next(call);
    });
  }

  async loginWithPassword(userId: string, password: string) {
    // First, login with a temporary client
    const tempClient = this.matrixSdk.createClient(this.homeserverUrl);
    const loginResponse = await tempClient.login('m.login.password', {
      user: userId,
      password: password,
    });

    // Then, create the final, authenticated client
    this.client = this.matrixSdk.createClient({
      baseUrl: this.homeserverUrl,
      accessToken: loginResponse.access_token,
      userId: loginResponse.user_id,
      deviceId: loginResponse.device_id,
      store: new MemoryStore(),
      useAuthorizationHeader: true,
    });

    this.client.on('Call.incoming' as any, (call: MatrixCall) => {
      this.incomingCall.next(call);
    });

    return loginResponse;
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

  async callUserDirectly(targetUserId: string): Promise<MatrixCall | null> {
    let room: Room | undefined = this.findDirectRoomWithUser(targetUserId);

    if (!room) {
      try {
        const createRoomResponse = await this.client.createRoom({
          is_direct: true,
          invite: [targetUserId],
        });
        room = this.client.getRoom(createRoomResponse.room_id)!;
      } catch (error) {
        console.error("Failed to create direct room:", error);
        return null;
      }
    }

    if (!room) {
      console.error("Could not find or create a direct room with user:", targetUserId);
      return null;
    }

    const call = this.matrixSdk.createNewMatrixCall(this.client, room.roomId);
    if (call) {
      call.placeVideoCall();
    }
    return call;
  }

  answerCall(call: MatrixCall): MatrixCall {
    call.answer();
    return call;
  }

  private findDirectRoomWithUser(userId: string): Room | undefined {
    const rooms = this.client.getRooms();
    return rooms.find(r => {
      const members = r.getJoinedMembers();
      return members.length === 2 && members.some(m => m.userId === userId);
    });
  }
}