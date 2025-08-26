import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

@Controller('/')
export class WebController {
  @Get()
  root(@Res() res: Response) {
    // Serve clients/index.html as the SPA entry
    const filePath = path.join(process.cwd(), 'clients', 'index.html');
    res.sendFile(filePath);
  }
}
