import { Injectable } from '@angular/core';
import * as matrixcs from 'matrix-js-sdk';
import { MatrixClient, ICreateClientOpts, MatrixCall } from 'matrix-js-sdk';

@Injectable({
  providedIn: 'root'
})
export class MatrixSdkWrapper {
  // This property makes the service testable
  private sdk = matrixcs;

  createClient(options: string | ICreateClientOpts): MatrixClient {
    const clientOptions: ICreateClientOpts =
      typeof options === 'string'
        ? { baseUrl: options }
        : options;

    // This now uses "this.sdk"
    return this.sdk.createClient(clientOptions);
  }

  createNewMatrixCall(client: MatrixClient, roomId: string): MatrixCall | null {
    // This also now uses "this.sdk"
    return this.sdk.createNewMatrixCall(client, roomId);
  }
}