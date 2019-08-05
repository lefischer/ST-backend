const signature = (sequelize, DataTypes) => {
  const Signature = sequelize.define('signature', {
    signature: {
      type: DataTypes.TEXT,
      validate: { notEmpty: true },
    },
    lat: {
      type: DataTypes.FLOAT,
    },
    lon: {
      type: DataTypes.FLOAT,
    }
  });

  Signature.associate = models => {
    Signature.belongsTo(models.Ticket);
  }

  return Signature;
};

export default signature;
