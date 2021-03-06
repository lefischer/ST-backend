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

      console.log(`limit ${limit} client ${clients.length}`);
      const hasNextPage = clients.length > limit;
      const edges = hasNextPage ? clients.slice(0, -1) : clients;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: () => {
            if (edges.length > 0){
              return toCursorHash(
                edges[edges.length - 1].createdAt.toString(),
              )
            } else {
              return toCursorHash("")
            }
          },
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
        : {
            where: {
              clientId: id,
            }
          };

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
          endCursor: () => {
            if (edges.length > 0){
              return toCursorHash(
                edges[edges.length - 1].createdAt.toString(),
              )
            } else {
              return toCursorHash("")
            }
          },
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
        : {
          where: {
            clientId: id,
          }
        };

      const users = await models.User.findAll({
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
          endCursor: () => {
            if (edges.length > 0){
              return toCursorHash(
                edges[edges.length - 1].createdAt.toString(),
              )
            } else {
              return toCursorHash("")
            }
          },
        },
      };
    },
  },

  Mutation: {
    createClient: combineResolvers(
      isAuthenticated,
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
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.Client.destroy({ where: { id } });
      },
    ),
  },
};
