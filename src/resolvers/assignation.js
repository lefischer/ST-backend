import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin, isAssignationOwner } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

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
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
        },
      };
    },

    userAssignations: async (parent, {userId, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              userId: userId,
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
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
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

        const assignation = await models.Assignation.create({
          userId,
          ticketId,
          active: true,
        });

        return assignation;
      },
    ),

    updateAssignation: combineResolvers (
      isAuthenticated,
      async (parent, {id}, {models}) => {
        const assignation = models.Assignation.findById(id)

        const active = false
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
