import { gql } from 'apollo-server-express';

import userSchema from './user';
import messageSchema from './message';
import roleSchema from './role';
import clientSchema from './client';
import ticketSchema from './ticket';
import stateSchema from './state';
import chatSchema from './chat';


const linkSchema = gql`
  scalar Date

  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

export default [
  linkSchema,
  userSchema,
  messageSchema,
  roleSchema,
  clientSchema,
  ticketSchema,
  stateSchema,
  chatSchema,
];
