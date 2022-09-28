import { NexusGenEnums } from '../../nexus-typegen';

export class Card {
  id = '0';
  externalId = 0;
  ownerId = '';
  rarity: NexusGenEnums['CardRarity'] = 0;
  foil = false;
  quantity = 0;
  level = 0;
  createdAt = 0;
  updatedAt = +new Date();
}
