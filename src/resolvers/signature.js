import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = string =>
  Buffer.from(string, 'base64').toString('ascii');

export default {
  Query: {
    signature: async (parent, { id }, { models }) => {
      return await models.Signature.findById(id);
    },
  },

  Mutation: {
    createSignature: combineResolvers(
      isAuthenticated,
      async (parent, { signature, ticketId, lat, lon }, { models }) => {

        console.log("Creando Firma");

        const old = await models.Signature.findOne({
          where: {
            ticketId: ticketId
          }
        })

        if (old != null){
          await models.Signature.destroy({ where: { id: old.id } });
        }

        return await models.Signature.create({
          signature,
          lat,
          lon,
          ticketId,
        });
      },
    ),

    deleteSignature: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.Signature.destroy({ where: { id } });
      },
    ),
  },
};
