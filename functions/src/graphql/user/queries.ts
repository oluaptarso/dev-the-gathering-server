import { extendType } from 'nexus';
import * as functions from 'firebase-functions';
import UserService from '../../services/user.service';
import { UserObjectType } from './user';
import { instanceToPlain } from 'class-transformer';

export const UserQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('user', {
      type: UserObjectType,
      async resolve(parent, args, context, info) {
        if (!context.userId) {
          throw Error('Unauthorized request.');
        }
        functions.logger.log('USER::', context.userId);
        const userService = new UserService(context.db);
        const user = await userService.findOrCreate(context.userId);
        const canOpenBoosterPack = user.canOpenBoosterPack;
        const userData = instanceToPlain(user);
        userData.canOpenBoosterPack = canOpenBoosterPack;

        return userData;
      },
    });
  },
});
