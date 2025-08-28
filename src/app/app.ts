import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatrixService } from './services/matrix';
import { CallComponent } from './components/call/call';
import { LoginComponent } from './components/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CallComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  activeCall: any = null;
  isLoggedIn = false;
  statusMessage = '';

  // STEP 1: Hardcode your target Room ID here
  private readonly targetRoomId = '!uRffrUMzHjMGMBkABv:matrix.org';

  constructor(private matrixService: MatrixService) {}

  async onLoginSuccess() {
    this.isLoggedIn = true;
    await this.matrixService.start();
    this.statusMessage = `Ready to call. Logged in as ${this.matrixService.client.getUserId()}`;

    this.matrixService.incomingCall$.subscribe(call => {
      console.log("Answering incoming call...");
      call.answer();
      this.activeCall = call;
    });
  }

  // STEP 2: Simplify the startCall method to use the hardcoded ID
  async startCall() {
    if (!this.isLoggedIn) return;
    this.statusMessage = `Attempting to call room ${this.targetRoomId}...`;
    
    this.activeCall = await this.matrixService.placeCallByRoomId(this.targetRoomId);
    
    if (this.activeCall) {
      this.statusMessage = `Calling room...`;
    } else {
      this.statusMessage = `Could not place call. Are you a member of that room?`;
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
    this.statusMessage = '';
  }
}