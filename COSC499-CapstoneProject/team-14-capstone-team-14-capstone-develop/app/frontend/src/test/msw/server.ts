import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Configure the server separately
server.listen({
  onUnhandledRequest: 'bypass',
});
