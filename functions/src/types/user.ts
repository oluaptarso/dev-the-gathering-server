import * as moment from 'moment';
export class User {
  id = '0';
  lastBoosterPackOpenedAt: number | null = null;
  createdAt = +new Date();
  updatedAt = +new Date();

  get canOpenBoosterPack() {
    // Never open a booster package.
    if (!this.lastBoosterPackOpenedAt) return true;

    // Verify if the current day is greater than the day the user open the last booster pack.
    return moment().startOf('day').diff(moment(this.lastBoosterPackOpenedAt).startOf('day'), 'days') > 0;
  }
}
