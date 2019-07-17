import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    clients(cursor: String, limit: Int): ClientConnection!
    client(id: ID!): Client!
    clientUsers(id: ID!, cursor: String, limit: Int): UserConnection!
    clientTickets(id: ID!, cursor: String, limit: Int): TicketConnection!
  }

  extend type Mutation {
    createClient(name: String!, address: String!, email: String, phone: String): Client!
    deleteClient(id: ID!): Boolean!
  }

  type ClientConnection {
    edges: [Client!]!
    pageInfo: PageInfo!
  }

  type Client {
    id: ID!
    name: String!
    address: String!
    phone: String
    email: String
    createdAt: Date!
  }
`;
