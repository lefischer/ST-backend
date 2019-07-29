import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin, isTicketOwner } from './authorization';
import sendNotification from '../pushNotifications'

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

    supervisorTickets : async (parent, { userId, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              supervisorId: userId,
            },
          }
        : {
            where: {
              supervisorId: userId,
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
      console.log(`buscando ticket con id ${id}`);
      let ticket
      while (!ticket) {
        ticket = await models.Ticket.findOne({
          where: {id: id}
        });
      }
      console.log(ticket.description);
      return ticket
      // return await models.Ticket.findOne({
      //   where: {id: id}
      // });
    },
  },

  Mutation: {
    createTicket: combineResolvers(
      isAuthenticated,
      async (parent, { type, service, priority, description, ownerId, clientId }, { models, me }) => {
        const state = await models.State.findOne({
          where: {
            state: "creado"
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

        const state = await models.State.findOne({
          where: {
            state: "coordinado"
          }
        })

        const assignation = await models.Assignation.findOne({
          where: {
            ticketId: id,
            active: true
          }
        });

        if (assignation) {

          const user =  await models.User.findById(assignation.userId)
          const pushTokens = [user.pushToken]

          const update_title = `Ticket actualizado`
          const update_body = `Se ha coordinado el ticket con id ${ticket.id}.`
          const update_data = {
            type: 2,
            ticketId: ticket.id
          }

          sendNotification(pushTokens, update_title, update_body, update_data)
        }


        return await ticket.update({datetime, stateId: state.id})
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
