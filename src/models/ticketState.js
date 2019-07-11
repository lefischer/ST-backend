const ticketState = (sequelize, DataTypes) => {
  const TicketState = sequelize.define('ticketState', {

  });

  TicketState.associate = models => {
    TicketState.belongsTo(models.Ticket);
    TicketState.belongsTo(models.State);
  };

  return TicketState;
};

export default ticketState;
