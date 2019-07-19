import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    signature(id: ID!): [Signature!]
  }

  extend type Mutation {
    createSignature(signature: String!, ticketId: ID!, lat: Float, lon: Float): Signature!
    deleteSignature(id: ID!): Boolean!
  }

  type Signature {
    id: ID!
    signature: String!
    lat: Float
    lon: Float
    ticketId: ID!
  }
`;
