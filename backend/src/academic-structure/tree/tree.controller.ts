import { Controller, Get } from '@nestjs/common';
import { TreeService } from './tree.service.js';

@Controller('structure')
export class TreeController {
  constructor(private readonly service: TreeService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('tree')
  tree() {
    return this.service.tree();
  }
}
