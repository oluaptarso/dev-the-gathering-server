import { extendType } from 'nexus';
import * as functions from 'firebase-functions';
import CardService from '../../services/card.service';
import { CardObjectType } from './card';

export const CardQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('cards', {
      type: CardObjectType,
      async resolve(parent, args, context/* , info*/) {
        if (!context.userData || !context?.userData.id) {
          throw Error('Unauthorized request.');
        }
        if (!context.userData.emailVerified) {
          throw Error('User email not verified.');
        }
        functions.logger.log('USER::', context.userData);
        const cardService = new CardService(context.db);
        return await cardService.findAllByOwnerId(context.userData.id);
      },
    });
  },
});
