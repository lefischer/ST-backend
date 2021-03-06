import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import { AuthenticationError, UserInputError } from 'apollo-server';

import { isAdmin, isAuthenticated } from './authorization';

const toCursorHash = string => Buffer.from(string).toString('base64');

const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role } = user;
  return await jwt.sign({ id, email, username, role }, secret, {
    expiresIn,
  });
};

export default {
  Query: {
    users:  async (parent, { cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
            },
          }
        : {};

      const users = await models.User.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      });

      const hasNextPage = users.length > limit;
      const edges = hasNextPage ? users.slice(0, -1) : users;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: () => {
            if (edges.length > 0){
              return toCursorHash(
                edges[edges.length - 1].createdAt.toString(),
              )
            } else {
              return toCursorHash("")
            }
          },
        },
      };
    },

    user: async (parent, { id }, { models }) => {
      return await models.User.findById(id);
    },

    me: async (parent, args, { models, me }) => {
      if (!me) {
        return null;
      }
      return await models.User.findById(me.id);
    },

    roleUsers: async (parent, {role}, {models}) => {

      const this_role = await models.Role.findOne({
        where: {
          role: role
        }
      })

      const userRoles = await models.UserRole.findAll({
        where: {
          roleId: this_role.id
        }
      })

      const roles_id = userRoles.map(role => role.userId);

      const users = await models.User.findAll({
        where: {
          id : {$in: roles_id}
        }
      });

      return users

    },

    usersRole:  async (parent, {roles, cursor, limit = 100 }, { models }) => {

      const rolesInt = roles.map(role => parseInt(role))

      console.log(rolesInt);

      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              roleId: {$in: rolesInt},
            },
          }
        : {
          where: {
            roleId: {$in: rolesInt},
          }

        };

      const userRoles = await models.UserRole.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      })
      const roles_id = userRoles.map(role => role.userId);

      const users = await models.User.findAll({
        where: {
          id : {$in: roles_id}
        }
      });

      console.log(`limit ${limit} users ${roles_id.length}`);
      console.log(toCursorHash(userRoles[userRoles.length - 1].createdAt.toString()));
      const hasNextPage = userRoles.length > limit;
      const edges =  users;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: () => {
            if (userRoles.length > 0){
              return toCursorHash(
                userRoles[userRoles.length - 1].createdAt.toString(),
              )
            } else {
              return toCursorHash("")
            }
          },
        },
      };
    },
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password, roles, phone, client },
      { models, secret },
    ) => {
      const user = await models.User.create({
        username,
        email,
        password,
        phone,
        clientId: client
      });

      roles.forEach(async (id) => {
        await models.UserRole.create({
          userId: user.id,
          roleId: id
        })
      });


      return { token: createToken(user, secret, '24h') };
    },

    signIn: async (
      parent,
      { login, password, pushToken },
      { models, secret },
    ) => {
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError(
          'No user found with this login credentials.',
        );
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError('Invalid password.');
      }

      console.log(`Token recivido ${pushToken}`);
      if (pushToken){
        await user.update({ pushToken });
      }

      return { token: createToken(user, secret, '24h') };
    },

    createUser: async (
      parent,
      { username, email, password, roles, phone, client },
      { models, secret },
    ) => {
      const user = await models.User.create({
        username,
        email,
        password,
        phone,
        clientId: client
      });

      roles.forEach(async (id) => {
        await models.UserRole.create({
          userId: user.id,
          roleId: id
        })
      });

      return user;
    },

    updateUser: combineResolvers(
      isAuthenticated,
      async (parent, { username }, { models, me }) => {
        const user = await models.User.findById(me.id);
        return await user.update({ username });
      },
    ),

    updatePushToken: combineResolvers (
      isAuthenticated,
      async (parent, { pushToken }, { models, me }) => {
        const user = await models.User.findById(me.id);
        return await user.update({ pushToken });
      }
    ),

    deleteUser: combineResolvers(
      isAuthenticated,
      async (parent, { id }, { models }) => {
        return await models.User.destroy({
          where: { id },
        });
      },
    ),
  },

  User: {
    roles: async (user, args, { models }) => {
      const userRoles = await models.UserRole.findAll({
        where: {
          userId: user.id
        }
      })
      const roles_id = userRoles.map(role => role.roleId);
      return await models.Role.findAll({
        where: {
          id : {$in: roles_id}
        }
      });
    },
  },
};
