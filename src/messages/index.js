import sendNotification from '../pushNotifications'

const help = `Los comandos son:
@enCamino: notifica que se esta en camino
@enLugar: notifica que se ha llegado al lugar
@comenzar: notifica comienzo de trabajo
@problema <problema>: para reportar algun problema
@comentario <comentario>: para enviar un comentario

todos los mensajes pueden contener texto adicional al comando`

// const comandos = ["@enCamino", "@comenzar", "@enLugar", "@problema", "@comentario"]

export default (

   async ( message, chatId, ticket, user, models) => {

     const bot = await models.User.findOne({where: { username: "bot"}})
     const text = message.text

     if (text.startsWith("@enCamino")){

       return await models.Message.create({
         text: `Registro en camino a las ${message.createdAt}`,
         chatId,
         userId: bot.id,
       });

     } else if (text.startsWith("@enLugar")) {

       return await models.Message.create({
         text: `Registro llegada a las ${message.createdAt}`,
         chatId,
         userId: bot.id,
       });

     } else if (text.startsWith("@comenzar")) {

       const state = await models.State.findOne({
         where: {
           state: "en progreso"
         }
       })

       const this_ticket = await models.Ticket.findById(ticket.id)
       await this_ticket.update({stateId: state.id})

       const pushTokens = [user.pushToken]
       const update_title = `Ticket actualizado`
       const update_body = `Se ha actualizado el estado del ticket ${ticket.id}.`
       const update_data = {
         type: 2,
         ticketId: ticket.id
       }

       sendNotification(pushTokens, update_title, update_body, update_data)

       return await models.Message.create({
         text: `Registro trabajo iniciado a las ${message.createdAt}`,
         chatId,
         userId: bot.id,
       });


     } else if (text.startsWith("@problema")) {

       if (text == "@problema") {

         return await models.Message.create({
           text: `Problema vacio`,
           chatId,
           userId: bot.id,
         });

       } else {
         return await models.Message.create({
           text: `Problema registrado a las ${message.createdAt}`,
           chatId,
           userId: bot.id,
         });
       }

     } else if (text.startsWith("@comentario")) {

       if (text == "@comentario") {
         return await models.Message.create({
           text: `Comentario vacio`,
           chatId,
           userId: bot.id,
         });

       } else {
         return await models.Message.create({
           text: `Comentario registrado a las ${message.createdAt}`,
           chatId,
           userId: bot.id,
         });
       }

     } else {

       return await models.Message.create({
         text: help,
         chatId,
         userId: bot.id,
       });
     }
   }


)
