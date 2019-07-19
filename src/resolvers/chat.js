import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import { isAuthenticated } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    chats: async (parent, { cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
            },
          }
        : {};

      const messages = await models.Chat.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = messages.length > limit;
      const edges = hasNextPage ? chat.slice(0, -1) : chat;

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
    chat: async (parent, { id }, { models }) => {
      return await models.Chat.findById(id);
    },
  },

  Chat: {
    ticket: async (chat, args, { loaders }) => {
      return await loaders.ticket.load(chat.ticketId);
    },
  },

  Subscription: {
    messageCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.MESSAGE.CREATED),
    },
  },
};
