const state = (sequelize, DataTypes) => {
  const State = sequelize.define('state', {
    state: {
      type: DataTypes.STRING,
      validate: { notEmpty: true },
    },
  });

  State.associate = models => {
    State.hasMany(models.TicketState, { onDelete: 'CASCADE' });
    State.hasMany(models.Ticket, { onDelete: 'NO ACTION' });
  }

  return State;
};

export default state;
