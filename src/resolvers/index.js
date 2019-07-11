import { GraphQLDateTime } from 'graphql-iso-date';

import userResolvers from './user';
import messageResolvers from './message';
import roleResolvers from './role';
import ticketResolvers from './ticket';
import clientResolvers from './client';
import stateResolvers from './state';
import chatResolvers from './chat';

const customScalarResolver = {
  Date: GraphQLDateTime,
};

export default [
  customScalarResolver,
  userResolvers,
  messageResolvers,
  roleResolvers,
  ticketResolvers,
  clientResolvers,
  stateResolvers,
  chatResolvers,
];
