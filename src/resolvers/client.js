import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAdmin, isAuthenticated } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    clients: async (parent, { cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
            },
          }
        : {};

      const clients = await models.Client.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = clients.length > limit;
      const edges = hasNextPage ? clients.slice(0, -1) : clients;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
        },
      };
    },

    client: async (parent, { id }, { models }) => {
      return await models.Client.findById(id);
    },

    clientTickets: async (parent, {id, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              clientId: id
            },
          }
        : {};

      const tickets = await models.Ticket.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = tickets.length > limit;
      const edges = hasNextPage ? tickets.slice(0, -1) : tickets;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
        },
      };
    },

    clientUsers: async (parent, {id, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              clientId: id
            },
          }
        : {};

      const users = await users.Ticket.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = users.length > limit;
      const edges = hasNextPage ? users.slice(0, -1) : users;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
        },
      };
    },
  },

  Mutation: {
    createClient: combineResolvers(
      isAdmin,
      async (parent, {name, address, email, phone}, { models, me }) => {
        const client = await models.Client.create({
          name: name,
          address: address,
          email: email,
          phone: phone,
        });

        return client;
      },
    ),

    deleteClient: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.Client.destroy({ where: { id } });
      },
    ),
  },
};
