import Sequelize from 'sequelize';

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
  });
} else {
  sequelize = new Sequelize(
    process.env.TEST_DATABASE || process.env.DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
      dialect: 'postgres',
    },
  );
}

const models = {
  User: sequelize.import('./user'),
  Message: sequelize.import('./message'),
  Role: sequelize.import('./role'),
  UserRole: sequelize.import('./userRole'),
  Ticket: sequelize.import('./ticket'),
  Client: sequelize.import('./client'),
  State: sequelize.import('./state'),
  TicketState: sequelize.import('./ticketState'),
  Chat: sequelize.import('./chat'),
  Assignation: sequelize.import('./assignation'),
  Signature: sequelize.import('./signature'),
};

Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

export { sequelize };

export default models;
