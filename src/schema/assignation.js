import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    assignations(cursor: String, limit: Int): AssignationConnection!
    assignation(id: ID!): Assignation!
    userAssignations(userId: ID!, cursor: String, limit: Int): AssignationConnection!
    ticketAssignations(ticketId: ID!): [Assignation!]
  }

  extend type Mutation {
    createAssignation(ticketId: ID!, userId: ID!): Assignation!
    updateAssignation(id: ID!): Assignation!
    deleteAssignation(id: ID!): Boolean!
  }

  type AssignationConnection {
    edges: [Assignation!]!
    pageInfo: PageInfo!
  }

  type Assignation {
    id: ID!
    active: Boolean!
    ticket: Ticket!
    user: User!
  }
`;
