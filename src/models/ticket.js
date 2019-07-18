const ticket = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('ticket', {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    datetime: {
      type: DataTypes.DATE
    },
    signature: {
      type: DataTypes.TEXT,
    }

  });

  Ticket.associate = models => {
    Ticket.belongsTo(models.User, {as: 'owner'});
    Ticket.belongsTo(models.User, {as: 'supervisor'});
    Ticket.belongsTo(models.Client);
    Ticket.hasMany(models.TicketState, { onDelete: 'CASCADE' });
    Ticket.hasMany(models.Assignation, { onDelete: 'CASCADE' });
    Ticket.belongsTo(models.State);
    Ticket.hasOne(models.Chat, { onDelete: 'NO ACTION' });
  };

  return Ticket;
};

export default ticket;
