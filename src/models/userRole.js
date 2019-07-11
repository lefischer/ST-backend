const userRole = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('userRole', {

  });

  UserRole.associate = models => {
    UserRole.belongsTo(models.User);
    UserRole.belongsTo(models.Role);
  };

  return UserRole;
};

export default userRole;
