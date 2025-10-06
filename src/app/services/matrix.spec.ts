import { TestBed } from '@angular/core/testing';
import { MatrixService } from './matrix';
import { MatrixSdkWrapper } from './matrix-sdk.wrapper';
import { MemoryStore } from 'matrix-js-sdk';

// This mock class simulates the client returned by the sdk
class MockMatrixClient {
  private listeners: { [event: string]: Function[] } = {};
  public on = jasmine.createSpy('on').and.callFake((event: string, cb: Function) => {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(cb);
  });
  public trigger = (event: string, data?: any) => {
    (this.listeners[event] || []).forEach(cb => cb(data));
  };
  public login = jasmine.createSpy('login').and.resolveTo({ access_token: 'token', user_id: '@user:matrix.org', device_id: 'DEVICE123' });
  public logout = jasmine.createSpy('logout').and.resolveTo(undefined);
  public startClient = jasmine.createSpy('startClient');
  public stopClient = jasmine.createSpy('stopClient');
  public clearStores = jasmine.createSpy('clearStores').and.resolveTo(undefined);
  public createRoom = jasmine.createSpy('createRoom').and.resolveTo({ room_id: '!room:matrix.org' });
  public getRoom = jasmine.createSpy('getRoom').and.returnValue({ roomId: '!room:matrix.org', getJoinedMembers: () => [] });
  public getRooms = jasmine.createSpy('getRooms').and.returnValue([]);
}

fdescribe('MatrixService', () => {
  let service: MatrixService;
  let mockClient: MockMatrixClient;
  let matrixSdkWrapperSpy: jasmine.SpyObj<MatrixSdkWrapper>;
  let mockCall: { placeVideoCall: jasmine.Spy, answer: jasmine.Spy };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatrixSdkWrapper', ['createClient', 'createNewMatrixCall']);

    TestBed.configureTestingModule({
      providers: [
        MatrixService,
        { provide: MatrixSdkWrapper, useValue: spy }
      ]
    });

    service = TestBed.inject(MatrixService);
    matrixSdkWrapperSpy = TestBed.inject(MatrixSdkWrapper) as jasmine.SpyObj<MatrixSdkWrapper>;

    mockClient = new MockMatrixClient();
    mockCall = {
      placeVideoCall: jasmine.createSpy('placeVideoCall'),
      answer: jasmine.createSpy('answer'),
    };
    
    matrixSdkWrapperSpy.createClient.and.returnValue(mockClient as any);
    matrixSdkWrapperSpy.createNewMatrixCall.and.returnValue(mockCall as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log and initialize client', () => {
    spyOn(console, 'log');
    service.initializeClient('https://matrix.org');

    expect(console.log).toHaveBeenCalledWith('Initializing Matrix client...');
    expect(matrixSdkWrapperSpy.createClient).toHaveBeenCalledWith({
      baseUrl: 'https://matrix.org',
      store: jasmine.any(MemoryStore)
    });
  });

  it('should emit incoming call on Call.incoming event', (done) => {
    spyOn(console, 'log');
    service.initializeClient('https://matrix.org');

    service.incomingCall.subscribe(call => {
      expect(console.log).toHaveBeenCalledWith('Incoming call detected');
      expect(call).toEqual({ id: 1 } as any);
      done();
    });

    mockClient.trigger('Call.incoming', { id: 1 });
  });

  it('should login with password and recreate client', async () => {
    // 👇 THE FIX IS HERE. This line was missing.
    service.initializeClient('https://matrix.org');

    const mockLoginResponse = {
      access_token: 'fake_token',
      user_id: '@test:matrix.org',
      device_id: 'DEVICE123'
    };
    mockClient.login.and.resolveTo(mockLoginResponse);

    const result = await service.loginWithPassword('@test:matrix.org', 'password123');

    expect(result).toBe(mockLoginResponse);
    
    // It creates a temporary client to log in
    expect(matrixSdkWrapperSpy.createClient).toHaveBeenCalledWith('https://matrix.org');
    
    // It creates the final client with auth details
    expect(matrixSdkWrapperSpy.createClient).toHaveBeenCalledWith(jasmine.objectContaining({
      baseUrl: 'https://matrix.org',
      accessToken: mockLoginResponse.access_token,
      userId: mockLoginResponse.user_id,
      deviceId: mockLoginResponse.device_id,
    }));
  });

  it('should create matrix service', () => {
    expect(service).toBeTruthy();
  })

  it('should ')
});