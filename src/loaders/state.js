export const batchStates = async (keys, models) => {
  const states = await models.State.findAll({
    where: {
      id: {
        $in: keys,
      },
    },
  });

  return keys.map(key => state.find(state => state.id === key));
};
