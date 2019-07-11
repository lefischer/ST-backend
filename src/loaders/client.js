export const batchClients = async (keys, models) => {
  const clients = await models.Client.findAll({
    where: {
      id: {
        $in: keys,
      },
    },
  });

  return keys.map(key => client.find(client => client.id === key));
};
