import * as _firestore from '@google-cloud/firestore';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { User } from '../types/user';
export default class UserService {
  _fireStoreContext: _firestore.Firestore;
  constructor(firestoreContext: _firestore.Firestore) {
    this._fireStoreContext = firestoreContext;
  }
  find = async (id: string): Promise<User> => {
    const user = await this._fireStoreContext.collection('users').doc(id).get();
    return plainToInstance(User, user.data());
  };
  create = async (userId: string): Promise<User> => {
    const userData = new User();
    userData.id = userId;
    userData.createdAt = +new Date();
    userData.updatedAt = userData.createdAt;
    await this._fireStoreContext.collection('users').doc(userData.id).set(instanceToPlain(userData));
    return userData;
  };
  update = async (user: User): Promise<User> => {
    await this._fireStoreContext.collection('users').doc(user.id).set(instanceToPlain(user));
    return user;
  };
  findOrCreate = async (userId: string): Promise<User> => {
    const findedUser = await this.find(userId);
    if (findedUser) {
      return findedUser;
    } else {
      return await this.create(userId);
    }
  };
}
