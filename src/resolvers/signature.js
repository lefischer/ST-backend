import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isAdmin } from './authorization';
import sendNotification from '../pushNotifications'

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

        const ticket = await models.Ticket.findById(ticketId)

        const state = await models.State.findOne({
          where: {
            state: "terminado"
          }
        })

        await ticket.update({stateId: state.id})

        const assignation = await models.Assignation.findOne({
          where: {
            ticketId: ticket.id,
            active: true
          }
        })

        const chat = await models.Chat.findOne({
          where: {
            ticketId: ticket.id
          }
        })

        const user = await models.User.findById(assignation.userId)
        const bot = await models.User.findOne({where: { username: "bot"}})

        const message = await models.Message.create({
          text: "Firma recibida. Actividad terminada",
          chatId: chat.id,
          userId: bot.id,
        });

        const pushTokens = [user.pushToken]
        const message_title = "Mensaje Nuevo"
        const message_body = "Firma recibida. Actividad terminada"
        const message_data = {
          type: 0,
          sender: "bot",
          text: "Firma recibida. Actividad terminada",
          createdAt: message.createdAt,
          ticketId: ticket.id
        }

        const update_title = "Ticket Actualizado"
        const update_body = `Se ha actualizado a terminado el estado del ticket con id ${ticket.id}`
        const update_data = {
          type: 2,
          ticketId: ticket.id
        }

        // console.log(data);
        sendNotification(pushTokens, message_title, message_body, message_data)
        sendNotification(pushTokens, update_title, update_body, update_data)


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
