// declare module "captcha-canvas" {
//   export class CaptchaGenerator {
//     constructor();
//     async generate(): Promise<void>;
//     get text(): string;
//     get image(): Buffer;
//   }
// }

// src/types/captcha-canvas.d.ts
// declare module "captcha-canvas" {
//   interface CaptchaGeneratorOptions {
//     width?: number;
//     height?: number;
//     fontSize?: number;
//     color?: string;
//     background?: string;
//   }

//   export class CaptchaGenerator {
//     constructor(options?: CaptchaGeneratorOptions);
//     text: string;
//     setDecoy(options: { total?: number; opacity?: number }): void;
//     setTrace(options: { color?: string }): void;
//     generate(): Promise<Buffer>;
//   }
// }

declare module "captcha-canvas" {
  interface CaptchaGeneratorOptions {
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
    background?: string;

    // Add optional noise and trace controls:
    decoyTotal?: number;       // number of decoy letters, 0 = no noise
    decoyOpacity?: number;     // opacity of decoy letters
    traceColor?: string | null; // color of trace line, null or empty = no trace
  }

  export class CaptchaGenerator {
    constructor(options?: CaptchaGeneratorOptions);
    text: string;

    setDecoy(options: { total?: number; opacity?: number }): void;
    setTrace(options: { color?: string }): void;
    generate(): Promise<Buffer>;
  }
}
