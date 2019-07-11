import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    tickets(cursor: String, limit: Int): TicketConnection!
    ticket(id: ID!): Ticket!
  }

  extend type Mutation {
    createTicket(
      type: String!,
      service: String!,
      description: String!,
      priority: String!,
      userId: ID!,
      clientId: ID!): Ticket!
    updateTicket(stateId: ID!, id: ID!): Ticket!
    deleteTicket(id: ID!): Boolean!
  }

  type TicketConnection {
    edges: [Ticket!]!
    pageInfo: PageInfo!
  }

  type Ticket {
    id: ID!
    type: String!
    service: String!
    priority: String!
    description: String!
    state: State!
    createdAt: Date!
    chat: Chat!
    client: Client!
    user: User
  }

  extend type Subscription {
    ticketCreated: TicketCreated!
  }

  type TicketCreated {
    ticket: Ticket!
  }
`;
