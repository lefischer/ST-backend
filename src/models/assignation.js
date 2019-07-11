const assignation = (sequelize, DataTypes) => {
  const Assignation = sequelize.define('assignation', {
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: { notEmpty: true },
    },
  });

  Assignation.associate = models => {
    Assignation.belongsTo(models.User);
    Assignation.belongsTo(models.Ticket);
  };

  return Assignation;
};

export default assignation;
