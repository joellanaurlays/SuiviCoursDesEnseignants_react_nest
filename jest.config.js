module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'backend/tsconfig.json' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@nestjs|class-transformer|class-validator|reflect-metadata|rxjs)/)',
  ],
  testRegex: '.*\\.spec\\.ts$',
};