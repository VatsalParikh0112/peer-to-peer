import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatrixService } from '../../services/matrix';
import { MatrixClient } from 'matrix-js-sdk';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  @Output() loginSuccess = new EventEmitter<MatrixClient>();

  loginData = { homeserver: 'https://matrix.org', userId: '', password: '' };
  isLoading = false;
  errorMessage = '';

  constructor(private matrixService: MatrixService) {}

  async login() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      this.matrixService.initializeClient(this.loginData.homeserver);
      await this.matrixService.loginWithPassword(this.loginData.userId, this.loginData.password);
      this.loginSuccess.emit(this.matrixService.client);
    } catch (error: any) {
      this.errorMessage = 'Login failed. Please check your credentials.';
    } finally {
      this.isLoading = false;
    }
  }
}
