import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    chats(cursor: String, limit: Int): ChatConnection!
    chat(id: ID!): Chat!
  }

  type ChatConnection {
    edges: [Chat!]!
    pageInfo: PageInfo!
  }

  type Chat {
    id: ID!
    ticket: Ticket!
  }
`;
