import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    users(cursor: String, limit: Int): UserConnection!
    usersRole(roles: [ID]!, cursor: String, limit: Int): UserConnection!
    roleUsers(role: String!): [User]!
    user(id: ID!): User
    me: User
  }

  extend type Mutation {
    signUp(
      username: String!,
      email: String!,
      password: String!,
      roles: [ID!]!,
      phone: String,
      client: ID,
    ): Token!

    signIn(login: String!, password: String!, pushToken: String): Token!
    createUser( username: String!, email: String!, password: String!, roles: [ID!], phone: String, client: ID): User!
    updateUser(username: String!): User!
    updatePushToken(pushToken: String!): User!
    deleteUser(id: ID!): Boolean!
  }

  type Token {
    token: String!
  }

  type UserConnection {
    edges: [User!]
    pageInfo: PageInfo!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    phone: String
    pushToken: String
    roles: [Role!]
  }
`;
