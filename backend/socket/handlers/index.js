import { setupChatHandlers } from "./chat.js"
import { setupMessageHandlers } from './messages.js';
import { setupPresenceHandlers } from './presence.js';
import { setupTypingHandlers } from './typing.js';

export function setupHandlers(io, socket) {
  setupChatHandlers(io, socket);
  setupMessageHandlers(io, socket);
  setupPresenceHandlers(io, socket);
  setupTypingHandlers(io, socket);
}