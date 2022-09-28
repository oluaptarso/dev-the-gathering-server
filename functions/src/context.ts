import { Request } from 'express';
import * as firebaseAdmin from 'firebase-admin';
import * as _firestore from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
firebaseAdmin.initializeApp();

export interface Context {
  db: _firestore.Firestore;
  userId?: string;
}

export const context = async ({ req }: { req: Request }): Promise<Context> => {
  let token = undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split('Bearer ')[1];
    try {
      const decodedIdToken = await firebaseAdmin.auth().verifyIdToken(token);
      token = decodedIdToken.uid;
    } catch (error) {
      functions.logger.error('Error while verifying Firebase ID token:', error);
      token = undefined;
    }
  }

  return {
    db: firebaseAdmin.firestore(),
    userId: token,
  };
};
