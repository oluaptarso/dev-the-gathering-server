import { objectType } from 'nexus';

export const UserObjectType = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.id('id');
    t.nullable.dateTime('lastBoosterPackOpenedAt');
    t.nullable.boolean('canOpenBoosterPack');
    t.nonNull.dateTime('createdAt');
    t.nonNull.dateTime('updatedAt');
  },
});
