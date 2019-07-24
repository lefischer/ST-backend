import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isMessageOwner, isAdmin } from './authorization';

import sendNotification from '../pushNotifications'
import proccessMessage from '../messages'

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    messages: async (parent, { chatId, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              chatId: chatId
            },
          }
        : {};

      const messages = await models.Message.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = messages.length > limit;
      const edges = hasNextPage ? messages.slice(0, -1) : messages;

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
    message: async (parent, { id }, { models }) => {
      return await models.Message.findById(id);
    },
  },

  Mutation: {
    createMessage: combineResolvers(
      isAuthenticated,
      async (parent, { text, chatId,  lat, lon}, { models, me }) => {
        const message = await models.Message.create({
          text,
          chatId,
          lat,
          lon,
          userId: me.id,
        });

        const chat = await models.Chat.findOne({
          where: {
            id: chatId
          },
          include: [{
            model: models.Ticket,

          }]
        })

        if (me.id == chat.ticket.supervisorId){
          const assignation = await models.Assignation.findOne({
            where: {
              ticketId: chat.ticket.id,
              active: true
            }
          })

          // console.log(assignation.userId);

          if (assignation){
            const user = await models.User.findById(assignation.userId)
            // console.log(user.username);

            if( user ) {
              const pushTokens = [user.pushToken]
              const title = "Mensaje Nuevo"
              const body = text
              const data = {
                type: 0,
                sender: me.username,
                text: text,
                createdAt: message.createdAt,
                ticketId: chat.ticket.id
              }

              // console.log(data);
              sendNotification(pushTokens, title, body, data)
            }
          }
        } else {
          // respuesta de bot
          return proccessMessage(message, chatId, chat.ticket, me, models)
        }

        return message;
      },
    ),

    deleteMessage: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.Message.destroy({ where: { id } });
      },
    ),
  },

  Message: {
    user: async (message, args, { models }) => {
      return await models.User.findById(message.userId);
    },
    chat: async (message, args, { models }) => {
      return await models.Chat.findById(message.chatId);
    },
  },

  Subscription: {
    messageCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.MESSAGE.CREATED),
    },
  },
};
