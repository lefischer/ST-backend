import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin, isTicketOwner } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    tickets: async (parent, { cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
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

    ticket: async (parent, { id }, { models }) => {
      return await models.Ticket.findById(id);
    },
  },

  Mutation: {
    createTicket: combineResolvers(
      isAuthenticated,
      async (parent, { type, service, priority, description, userId, clientId }, { models, me }) => {
        const state = await models.State.findOne({
          where: {
            state: "created"
          }
        })

        const ticket = await models.Ticket.create({
          type,
          service,
          priority,
          description,
          stateId: state.id,
          userId,
          clientId,
        }, {
          include: [models.Chat]
        });

        await models.TicketState.create({
          ticketId: ticket.id,
          stateId: state.id,
        })

        pubsub.publish(EVENTS.TICKET.CREATED, {
          ticketCreated: { message },
        });

        return ticket;
      },
    ),

    updateTicket: combineResolvers (
      isAdmin,
      async (parent, {stateId, id}, {models}) => {
        const ticket = models.Ticket.findById(id)

        await models.TicketState.create({
          ticketId: ticket.id,
          stateId: stateId,
        })

        return await ticket.update({stateId})
      }
    ),

    deleteTicket: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.Ticket.destroy({ where: { id } });
      },
    ),

  },

  Ticket: {
    chat: async (ticket, args, { loaders }) => {
      return await loaders.chat.load(ticket.chatId);
    },
    client: async (ticket, args, { loaders }) => {
      return await loaders.client.load(ticket.userId);
    },
    state:  async (ticket, args, { loaders }) => {
      return await loaders.state.load(ticket.stateId);
    },
  },

  Subscription: {
    ticketCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.TICKET.CREATED),
    },
  },
};
