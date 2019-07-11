import { PubSub } from 'apollo-server';

import * as MESSAGE_EVENTS from './message';
import * as TICKET_EVENTS from './ticket';

export const EVENTS = {
  MESSAGE: MESSAGE_EVENTS,
  TICKET: TICKET_EVENTS,
};

export default new PubSub();
