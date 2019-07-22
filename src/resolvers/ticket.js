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

    userTickets : async (parent, { userId, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              ownerId: userId,
            },
          }
        : {
            where: {
              ownerId: userId,
            },
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

    ticket: async (parent, { id }, { models }) => {
      return await models.Ticket.findById(id);
    },
  },

  Mutation: {
    createTicket: combineResolvers(
      isAuthenticated,
      async (parent, { type, service, priority, description, ownerId, clientId }, { models, me }) => {
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
          ownerId,
          clientId,
          stateId: state.id,
        });

        await models.TicketState.create({
          ticketId: ticket.id,
          stateId: state.id,
        })

        await models.Chat.create({
          ticketId: ticket.id
        })

        pubsub.publish(EVENTS.TICKET.CREATED, {
          ticketCreated: { ticket },
        });

        return ticket;
      },
    ),

    updateState: combineResolvers (
      isAuthenticated,
      async (parent, {stateId, id}, {models}) => {
        const ticket = await models.Ticket.findById(id)

        await models.TicketState.create({
          ticketId: ticket.id,
          stateId: stateId,
        })

        return await ticket.update({stateId})
      }
    ),

    updateDate: combineResolvers (
      isAuthenticated,
      async (parent, {date, id}, {models}) => {
        const ticket = await models.Ticket.findById(id)
        const datetime = Date.parse(date)

        return await ticket.update({datetime})
      }
    ),

    updateSupervisor: combineResolvers (
      isAuthenticated,
      async (parent, {supervisor, id}, {models}) => {
        const ticket = await models.Ticket.findById(id)

        // console.log(ticket);

        return await ticket.update({supervisorId: supervisor})
      }
    ),

    deleteTicket: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.Ticket.destroy({ where: { id } });
      },
    ),

  },

  Ticket: {
    chat: async (ticket, args, { models }) => {
      return await models.Chat.findOne({
        where: {
          ticketId: ticket.id
        }
      });
    },
    client: async (ticket, args, { models }) => {
      return await models.Client.findById(ticket.clientId);
    },
    state:  async (ticket, args, { models }) => {
      return await models.State.findById(ticket.stateId);
    },
    owner: async (ticket, args, { models }) => {
      return await models.User.findById(ticket.ownerId);
    },
    supervisor: async (ticket, args, { models }) => {
      if (ticket.supervisorId) {
        return await models.User.findById(ticket.supervisorId);
      } else {
        return null
      }
    },
    signature: async (ticket, args, {models}) => {
       return await models.Signature.findOne({
         where: {
           ticketId: ticket.id
         }
       })
    },
    assignation: async (ticket, args, { models }) => {
       const assignation = await models.Assignation.findOne({
         where: {
           ticketId: ticket.id,
           active: true,
         }
       });
       if (assignation) {
         return await models.User.findById(assignation.userId);
       } else {
         return null
       }
    },
  },

  Subscription: {
    ticketCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.TICKET.CREATED),
    },
  },
};
