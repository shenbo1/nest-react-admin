import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  baseUrl: process.env.BASE_URL,
}));
