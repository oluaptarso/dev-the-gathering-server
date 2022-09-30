import * as _firestore from '@google-cloud/firestore';
import { CardRarityEnum } from '../enums/card-rarity';
import { instanceToPlain } from 'class-transformer';
import { Card } from '../types/card';

export default class CardService {
  randomNumbersNeeded = 3;
  firstCut = 100;
  // 100000000000000000000000000000000000000000000000000
  lastBlockCut = 10 ** 50;
  // 10000000000000000000000000
  lastPartCut = 10 ** 25;
  defaultCardQuantitiesByRarity = new Map<number, number>();
  _fireStoreContext: _firestore.Firestore;

  constructor(firestoreContext: _firestore.Firestore) {
    this.defaultCardQuantitiesByRarity.set(CardRarityEnum.COMMON, 9);
    this.defaultCardQuantitiesByRarity.set(CardRarityEnum.UNCOMMON, 6);
    this.defaultCardQuantitiesByRarity.set(CardRarityEnum.RARE, 4);
    this.defaultCardQuantitiesByRarity.set(CardRarityEnum.EPIC, 2);
    this.defaultCardQuantitiesByRarity.set(CardRarityEnum.LEGENDARY, 1);

    this._fireStoreContext = firestoreContext;
  }

  find = async (id: string): Promise<Card> => {
    const card = await this._fireStoreContext.collection('cards').doc(id).get();
    return card.data() as Card;
  };
  findByOwnerAndExternalIds = async (owner: string, ids: number[]): Promise<Card[]> => {
    const cards = await this._fireStoreContext.collection('cards').where('ownerId', '==', owner).where('externalId', 'in', ids).get();
    return cards.docs.map((doc) => doc.data() as Card);
  };
  findAll = async (): Promise<Card[]> => {
    const cards = await this._fireStoreContext.collection('cards').get();
    return cards.docs.map((doc) => doc.data() as Card);
  };
  findAllByOwnerId = async (ownerId: string): Promise<Card[]> => {
    const cards = await this._fireStoreContext.collection('cards').where('ownerId', '==', ownerId).get();
    return cards.docs.map((doc) => doc.data() as Card);
  };
  openBoosterPackage = async (ownerId: string): Promise<Card[]> => {
    // TODO Caching the quantities
    const cardQuantitiesByRarity = new Map<number, number>();
    const cardQuantitiesByRarityDocs = await this._fireStoreContext.collection('cardQuantitiesByRarity').get();

    cardQuantitiesByRarityDocs.docs.map((doc) => {
      const docData = doc.data();
      cardQuantitiesByRarity.set(docData.cardRarity, docData.quantity);
    });

    const cardsToReturn: Card[] = [];

    const randomData = [this.getRandomCardData(), this.getRandomCardData(), this.getRandomCardData()];

    const openedCardsExternalIds: number[] = [];
    const openedCards: any = {};

    for (let i = 0; i < this.randomNumbersNeeded; i++) {
      const randomSplittedData = this.splitRandomInThreeParts(+randomData[i]);
      const card = this.revealCard(randomSplittedData, cardQuantitiesByRarity);
      /*
        If the user gets repeated cards in the same booster pack, we increment the quantity of the card in the hashmap,
        verify if one of them is foil and guarantee that the saved card is foil too.
      */
      if (card.externalId in openedCards) {
        openedCards[card.externalId].quantity++;
        openedCards[card.externalId].foil = openedCards[card.externalId].foil || card.foil;

        card.ownerId = ownerId;
        card.quantity = 0;
        card.level = 1;
        card.createdAt = +new Date();
        card.updatedAt = card.createdAt;

        cardsToReturn.push(card);
      } else {
        openedCards[card.externalId] = card;
        openedCardsExternalIds.push(card.externalId);
      }
    }

    const ownedCards = await this.findByOwnerAndExternalIds(ownerId, openedCardsExternalIds);
    for (let i = 0; i < openedCardsExternalIds.length; i++) {
      const openedCardsExternalId = openedCardsExternalIds[i];
      const openedCard = openedCards[openedCardsExternalId];

      const ownedCard = ownedCards.find((ownedCard) => ownedCard.externalId == openedCard.externalId);
      if (ownedCard) {
        /**
         * @dev if the new card its a foil one transform the old to foil.
         */
        if (openedCard.foil && !ownedCard.foil) {
          ownedCard.foil = true;
        }
        ownedCard.quantity += (openedCard.quantity + 1);
        /**
         * @dev if the card has the requirements to evolve, level up and ajust the quantity.
         */
        if (ownedCard.quantity >= ownedCard.level * 2) {
          ownedCard.quantity = ownedCard.quantity % (ownedCard.level * 2);
          ownedCard.level++;
        }
        ownedCard.updatedAt = +new Date();
        await this._fireStoreContext.collection('cards').doc(ownedCard.id).update(instanceToPlain(ownedCard));
        cardsToReturn.push(ownedCard);
      } else {
        openedCard.ownerId = ownerId;
        openedCard.quantity = openedCard.quantity > 0 ? openedCard.quantity : 0;
        if (openedCard.quantity >= openedCard.level * 2) {
          openedCard.quantity = openedCard.quantity % (openedCard.level * 2);
          openedCard.level++;
        }
        openedCard.createdAt = +new Date();
        openedCard.updatedAt = openedCard.createdAt;
        const res = await this._fireStoreContext.collection('cards').add(instanceToPlain(openedCard));
        openedCard.id = res.id;
        await this._fireStoreContext.collection('cards').doc(openedCard.id).update(instanceToPlain(openedCard));
        cardsToReturn.push(openedCard);
      }
    }
    return cardsToReturn;
  };

  // Method that breaks a 77 digits number into three 25 digits numbers.
  private splitRandomInThreeParts = (randomToSplit: number): number[] => {
    // removed the last 2 digits
    const normalizedRandom = randomToSplit / this.firstCut;

    const lastPartToCut = normalizedRandom % this.lastBlockCut;
    return [normalizedRandom / this.lastBlockCut, lastPartToCut / this.lastPartCut, lastPartToCut % this.lastPartCut];
  };

  private getRandomCardData = (): string => {
    const chars = '0123456789';
    const stringLength = 77;
    let randomstring = Math.floor(Math.random() * (9 - 1) + 1).toString();
    for (let i = 1; i < stringLength; i++) {
      const rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
  };

  private revealCard = (randoms: number[], cardQuantitiesByRarity: Map<number, number>): Card => {
    const rarityChance = (randoms[0] % 100) + 1;
    const foil = (randoms[2] % 100) + 1 <= 5;
    const card = new Card();
    card.foil = foil;
    card.quantity = 0;
    card.level = 1;

    let quantityCardsOfType = 0;
    let defaultQuantity = 0;

    if (rarityChance >= 50) {
      card.rarity = CardRarityEnum.COMMON;
      defaultQuantity = this.defaultCardQuantitiesByRarity.get(CardRarityEnum.COMMON) as number;
      quantityCardsOfType = cardQuantitiesByRarity.get(CardRarityEnum.COMMON) || defaultQuantity;
      card.externalId = (randoms[1] % quantityCardsOfType) + 1;
    } else if (rarityChance >= 30 && rarityChance <= 49) {
      card.rarity = CardRarityEnum.UNCOMMON;
      defaultQuantity = this.defaultCardQuantitiesByRarity.get(CardRarityEnum.UNCOMMON) as number;
      quantityCardsOfType = cardQuantitiesByRarity.get(CardRarityEnum.UNCOMMON) || defaultQuantity;
      card.externalId = (randoms[1] % quantityCardsOfType) + 1 + 1000;
    } else if (rarityChance >= 13 && rarityChance <= 29) {
      card.rarity = CardRarityEnum.RARE;
      defaultQuantity = this.defaultCardQuantitiesByRarity.get(CardRarityEnum.RARE) as number;
      quantityCardsOfType = cardQuantitiesByRarity.get(CardRarityEnum.RARE) || defaultQuantity;
      card.externalId = (randoms[1] % quantityCardsOfType) + 1 + 2000;
    } else if (rarityChance >= 5 && rarityChance <= 12) {
      card.rarity = CardRarityEnum.EPIC;
      defaultQuantity = this.defaultCardQuantitiesByRarity.get(CardRarityEnum.EPIC) as number;
      quantityCardsOfType = cardQuantitiesByRarity.get(CardRarityEnum.EPIC) || defaultQuantity;
      card.externalId = (randoms[1] % quantityCardsOfType) + 1 + 3000;
    } else {
      card.rarity = CardRarityEnum.LEGENDARY;
      defaultQuantity = this.defaultCardQuantitiesByRarity.get(CardRarityEnum.LEGENDARY) as number;
      quantityCardsOfType = cardQuantitiesByRarity.get(CardRarityEnum.LEGENDARY) || defaultQuantity;
      card.externalId = (randoms[1] % quantityCardsOfType) + 1 + 4000;
    }

    return card;
  };
}
