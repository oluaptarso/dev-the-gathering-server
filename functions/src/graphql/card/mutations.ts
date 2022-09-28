import { extendType /* , nonNull, stringArg*/ } from 'nexus';
import * as functions from 'firebase-functions';
import CardService from '../../services/card.service';
import { CardObjectType } from './card';
import UserService from '../../services/user.service';

export const OpenBoosterPackMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.list.nonNull.field('openBoosterPack', {
      type: CardObjectType,
      //   args: {
      //     owner: nonNull(stringArg()),
      //   },

      async resolve(parent, args, context) {
        if (!context.userData || !context?.userData.id) {
          throw Error('Unauthorized request.');
        }
        if (!context.userData.emailVerified) {
          throw Error('User email not verified.');
        }
        functions.logger.log('USER::', context.userData);
        const userService = new UserService(context.db);
        const user = await userService.find(context.userData.id);

        if (!user) throw Error(`User doesn't exist`);

        if (user.canOpenBoosterPack) {
          const cardService = new CardService(context.db);
          const cards = await cardService.openBoosterPackage(context.userData.id);
          user.lastBoosterPackOpenedAt = +new Date();
          await userService.update(user);
          return cards;
        } else {
          throw Error('You already have opened a booster pack today.');
        }
      },
    });
  },
});
