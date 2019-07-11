export const batchTickets = async (keys, models) => {
  const tickets = await models.Ticket.findAll({
    where: {
      id: {
        $in: keys,
      },
    },
  });

  return keys.map(key => tickets.find(ticket => ticket.id === key));
};
