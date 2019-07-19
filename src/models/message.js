const message = (sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
    text: {
      type: DataTypes.STRING,
      validate: { notEmpty: true },
    },
    lat: {
      type: DataTypes.FLOAT,
    },
    lon: {
      type: DataTypes.FLOAT,
    }
  });

  Message.associate = models => {
    Message.belongsTo(models.User);
    Message.belongsTo(models.Chat)
  };

  return Message;
};

export default message;
