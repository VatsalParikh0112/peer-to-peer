import { TestBed } from '@angular/core/testing';
import { MatrixSdkWrapper } from './matrix-sdk.wrapper';
import { ICreateClientOpts, MatrixClient } from 'matrix-js-sdk';

fdescribe('MatrixSdkWrapper', () => {
  let service: MatrixSdkWrapper;
  let sdkSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    sdkSpy = jasmine.createSpyObj('matrixcs', ['createClient', 'createNewMatrixCall']);
    sdkSpy.createClient.and.returnValue('mocked client' as any);
    sdkSpy.createNewMatrixCall.and.returnValue('mocked call' as any);

    TestBed.configureTestingModule({
      providers: [
        MatrixSdkWrapper,
        { provide: 'MATRIX_SDK', useValue: sdkSpy },
      ],
    });
    service = TestBed.inject(MatrixSdkWrapper);
    (service as any).sdk = sdkSpy;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createClient should handle string input', () => {
    service.createClient('https://matrix.org');
    expect(sdkSpy.createClient).toHaveBeenCalledOnceWith({ baseUrl: 'https://matrix.org' });
  });

  it('createClient should handle object input', () => {
    const opts: ICreateClientOpts = { baseUrl: 'https://matrix.org', accessToken: 'token', userId: '@u:matrix.org' };
    service.createClient(opts);
    expect(sdkSpy.createClient).toHaveBeenCalledOnceWith(opts);
  });

  it('createNewMatrixCall should forward correctly', () => {
    const mockClient = {} as MatrixClient;
    const roomId = '!abc:matrix.org';
    service.createNewMatrixCall(mockClient, roomId);
    expect(sdkSpy.createNewMatrixCall).toHaveBeenCalledOnceWith(mockClient, roomId);
  });
});
