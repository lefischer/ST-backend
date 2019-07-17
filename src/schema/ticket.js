import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    tickets(cursor: String, limit: Int): TicketConnection!
    userTickets(userId: ID!, cursor: String, limit: Int): TicketConnection!
    ticket(id: ID!): Ticket!
  }

  extend type Mutation {
    createTicket(
      type: String!,
      service: String!,
      description: String!,
      priority: String!,
      ownerId: ID!,
      clientId: ID!): Ticket!
    updateState(stateId: ID!, id: ID!): Ticket!
    updateDate(date: String!, id: ID!): Ticket!
    updateSupervisor(supervisor: ID!, id: ID!): Ticket!
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
    chat: Chat
    client: Client!
    owner: User!
    datetime: Date
    supervisor: User
    assignation: User
  }

  extend type Subscription {
    ticketCreated: TicketCreated!
  }

  type TicketCreated {
    ticket: Ticket!
  }
`;
