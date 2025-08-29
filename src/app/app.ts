import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatrixService } from './services/matrix';
import { Call } from './components/call/call';
import { Login } from './components/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, Call , Login],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  activeCall: any = null;
  isLoggedIn = false;
  statusMessage = '';
  incomingCall: any = null;

  constructor(private matrixService: MatrixService) {}

  async onLoginSuccess() {
    this.isLoggedIn = true;
    await this.matrixService.start();
    this.statusMessage = `Ready to call. Logged in as ${this.matrixService.client.getUserId()}`;

    this.matrixService.incomingCall$.subscribe(call => {
      console.log("Incoming call...");
      this.incomingCall = call; // Store incoming call
      this.statusMessage = "Incoming call...";
    });
  }

  async startCall(roomId: string) {
    if (!roomId || !this.isLoggedIn) {
      this.statusMessage = "Please enter a Room ID.";
      return;
    }

    this.statusMessage = `Attempting to call in room ${roomId}...`;
    this.activeCall = await this.matrixService.placeCallByRoomId(roomId);

    if (this.activeCall) {
      this.statusMessage = `Calling in room ${roomId}...`;
    } else {
      this.statusMessage = `Could not place call. Are you a member of that room?`;
    }
  }

  acceptCall() {
    if (this.incomingCall) {
      this.incomingCall.answer();
      this.activeCall = this.incomingCall;
      this.incomingCall = null;
      this.statusMessage = "In Call...";
    }
  }

  rejectCall() {
    if (this.incomingCall) {
      this.incomingCall.hangup();
      this.incomingCall = null;
      this.statusMessage = "Call rejected.";
    }
  }

  onCallEnded() {
    this.activeCall = null;
    this.statusMessage = 'Call ended.';
  }

  async logout() {
    await this.matrixService.logout();
    this.isLoggedIn = false;
    this.activeCall = null;
    this.incomingCall = null;
    this.statusMessage = '';
  }
}
