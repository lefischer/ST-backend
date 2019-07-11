export const batchAssignations = async (keys, models) => {
  const assignations = await models.Assignation.findAll({
    where: {
      id: {
        $in: keys,
      },
    },
  });

  return keys.map(key => assignations.find(assignation => assignation.id === key));
};
