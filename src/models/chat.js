const chat = (sequelize, DataTypes) => {
  const Chat = sequelize.define('chat', {
  });

  Chat.associate = models => {
    Chat.hasMany(models.Message);
    Chat.belongsTo(models.Ticket);
  };

  return Chat;
};

export default chat;
