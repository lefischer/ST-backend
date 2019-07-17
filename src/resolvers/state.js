import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin} from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    states: async (parent, {}, { models }) => {
      return await models.State.findAll()
    },
    state: async (parent, { id }, { models }) => {
      return await models.State.findById(id);
    },
  },

  Mutation: {
    createState: combineResolvers(
      isAuthenticated,
      async (parent, { state }, { models}) => {
        const thisState = await models.State.create({
          state
        });

        return thisState;
      },
    ),

    deleteState: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.State.destroy({ where: { id } });
      },
    ),
  },
};
