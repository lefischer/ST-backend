const client = (sequelize, DataTypes) => {
  const Client = sequelize.define('client', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    phone: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {isEmail: true}
    },
  });

  Client.associate = models => {
    Client.hasMany(models.User, { onDelete: 'CASCADE'});
    Client.hasMany(models.Ticket, { onDelete: 'CASCADE'});
  };

  return Client;
};

export default client;
