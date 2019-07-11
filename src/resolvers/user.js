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
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
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

    usersRole:  async (parent, {id, cursor, limit = 100 }, { models }) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor),
              },
              roleId: id,
            },
          }
        : {};

      const userRoles = await models.UserRole.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOptions,
      })
      const roles_id = userRoles.map(role => role.roleId);

      const users = await models.Role.findAll({
        where: {
          id : {$in: roles_id}
        }
      });

      const hasNextPage = users.length > limit;
      const edges = hasNextPage ? users.slice(0, -1) : users;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString(),
          ),
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


      return { token: createToken(user, secret, '7d') };
    },

    signIn: async (
      parent,
      { login, password },
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

      return { token: createToken(user, secret, '30m') };
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

    deleteUser: combineResolvers(
      isAdmin,
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
