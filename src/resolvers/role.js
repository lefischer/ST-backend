import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    roles: async (parent, { }, { models }) => {
      return await models.Role.findAll()
    },
    role: async (parent, { id }, { models }) => {
      return await models.Role.findById(id);
    },
  },

  Mutation: {
    createRole: combineResolvers(
      async (parent, { role }, { models}) => {
        const thisRole = await models.Role.create({
          role
        });

        return thisRole;
      },
    ),

    deleteRole: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.Role.destroy({ where: { id } });
      },
    ),
  },
};
