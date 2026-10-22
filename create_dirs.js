import * as fs from 'fs';
import * as path from 'path';

const dirs = [
  'backend/src/enseignements/controllers',
  'backend/src/enseignements/services',
  'backend/src/enseignements/use-cases',
  'backend/src/enseignements/repositories',
  'backend/src/enseignements/dto',
  'backend/src/enseignements/entities'
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
});

console.log('Directories created successfully');
