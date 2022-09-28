import { enumType, objectType } from 'nexus';
import { CardRarityEnum } from '../../enums/card-rarity';

export const CardRarity = enumType({
  name: 'CardRarity',
  members: CardRarityEnum,
});

export const CardObjectType = objectType({
  name: 'Card',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.int('externalId');
    t.nonNull.string('ownerId');
    t.nonNull.field('rarity', { type: CardRarity });
    t.nonNull.boolean('foil');
    t.nonNull.int('quantity');
    t.nonNull.int('level');
    t.nonNull.dateTime('createdAt');
    t.nonNull.dateTime('updatedAt');
  },
});
