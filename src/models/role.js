const role = (sequelize, DataTypes) => {
  const Role = sequelize.define('role', {
    role: {
      type: DataTypes.STRING,
      validate: { notEmpty: true },
    },
  });

  Role.associate = models => {
    Role.hasMany(models.UserRole, { onDelete: 'CASCADE' });
  }

  return Role;
};

export default role;
