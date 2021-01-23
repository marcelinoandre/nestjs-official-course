import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealthCheck(): { ping: string } {
    return { ping: 'pong' };
  }
}
