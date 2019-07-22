import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin, isAssignationOwner } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

import sendNotification from '../pushNotifications'

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    assignations: async (parent, { cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              active: true
            },
          }
        : {};

      const assignations = await models.Assignation.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = assignations.length > limit;
      const edges = hasNextPage ? assignations.slice(0, -1) : assignations;

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

    userAssignations: async (parent, {userId, cursor, limit = 100 }, { models }) => {
      console.log("Tickets Asignados a un usuario");
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              userId: userId,
            },
          }
        : {
            where: {
              userId: userId,
            }
          };

      const assignations = await models.Assignation.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = assignations.length > limit;
      const edges = hasNextPage ? assignations.slice(0, -1) : assignations;

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

    ticketAssignations: async (parent, {ticketId}, {models}) => {
      return await models.Assignation.findAll({
        where: {
          ticketId: ticketId,
        }
      });
    },

    assignation: async (parent, { id }, { models }) => {
      return await models.Assignation.findById(id);
    },
  },

  Mutation: {
    createAssignation: combineResolvers(
      isAuthenticated,
      async (parent, { userId, ticketId}, { models, me }) => {

        const ticket = await models.Ticket.findById(ticketId)

        const assignations = await models.Assignation.findAll({
          where: {
            ticketId: ticketId,
            active: true
          }
        });


        const title = "Asignacion Eliminada"
        const body = `Se ha eliminado la asignacion al ticket con id ${ticketId}`
        const data = {
          type: 3,
          ticketId: ticketId
        }

        assignations.forEach(async (assignation) => {
          await assignation.update({active: false});
          const user = await models.User.findById(assignation.userId);
          sendNotification([user.pushToken], title, body, data)
        })

        const assignation = await models.Assignation.create({
          userId,
          ticketId,
          active: true,
        });

        const assignation_user = await models.User.findById(userId)
        const assignation_pushTokens = [assignation_user.pushToken]
        const assignation_title = "Nueva asignacion"
        const assignation_body = `Se ha asignado un nuevo ticket ha ${assignation_user.username}`
        const assignation_data = {
          type: 1,
          ticketId: ticketId
        }

        sendNotification(assignation_pushTokens, assignation_title, assignation_body, assignation_data)

        return assignation;
      },
    ),

    updateAssignation: combineResolvers (
      isAuthenticated,
      async (parent, {id}, {models}) => {
        const assignation = models.Assignation.findById(id)

        const active = false

        const user = model.User.findById(assignation.userId);
        const pushTokens = [user.pushToken]
        const title = "Asignacion Eliminada"
        const body = `Se ha eliminado la asignacion al ticket con id ${assignation.ticketId}`
        const data = {
          type: 3,
          ticketId: ticketId
        }
        sendNotification(pushTokens, title, body, data)

        return await assignation.update({active})
      }
    ),

    deleteAssignation: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.Assignation.destroy({ where: { id } });
      },
    ),
  },

  Assignation: {
    ticket: async (assignation, args, { models }) => {
      return await models.Ticket.findById(assignation.ticketId);
    },
    user: async (assignation, args, { models }) => {
      return await models.User.findById(assignation.userId);
    },
  },
};
