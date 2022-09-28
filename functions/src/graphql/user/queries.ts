import { extendType } from 'nexus';
import * as functions from 'firebase-functions';
import UserService from '../../services/user.service';
import { UserObjectType } from './user';
// import { instanceToPlain } from 'class-transformer';

export const UserQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('user', {
      type: UserObjectType,
      async resolve(parent, args, context) {
        if (!context.userData || !context?.userData.id) {
          throw Error('Unauthorized request.');
        }
        if (!context.userData.emailVerified) {
          throw Error('User email not verified.');
        }
        functions.logger.log('USER::', context.userData);
        const userService = new UserService(context.db);
        const user = await userService.findOrCreate(context.userData.id);
        const canOpenBoosterPack = user.canOpenBoosterPack;
        // const userData = instanceToPlain(user);
        // userData.canOpenBoosterPack = canOpenBoosterPack;

        return { ...user, canOpenBoosterPack };
      },
    });
  },
});
