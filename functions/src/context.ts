import { Request } from 'express';
import * as firebaseAdmin from 'firebase-admin';
import * as _firestore from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
import { UserAuthData } from './types/user';
firebaseAdmin.initializeApp();

export interface Context {
  db: _firestore.Firestore;
  userData?: UserAuthData;
}

export const context = async ({ req }: { req: Request }): Promise<Context> => {
  let userData;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split('Bearer ')[1];
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      userData = {
        id: decodedToken.uid,
        emailVerified: decodedToken.email_verified || false,
      };
    } catch (error) {
      functions.logger.error('Error while verifying Firebase ID token:', error);
    }
  }

  return {
    db: firebaseAdmin.firestore(),
    userData,
  };
};
