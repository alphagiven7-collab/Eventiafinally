declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraId: { facingMode: string },
      config: { fps?: number; qrbox?: number },
      successCallback: (decodedText: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
  }
}