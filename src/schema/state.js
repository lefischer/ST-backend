import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    states: [State!]
    state(id: ID!): State!
  }

  extend type Mutation {
    createState(state: String!): State!
    deleteState(id: ID!): Boolean!
  }

  type State {
    id: ID!
    state: String!
  }
`;
