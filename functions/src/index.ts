import * as functions from 'firebase-functions';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-cloud-functions';
import { schema } from './schema';
import { context } from './context';

const apolloServer = new ApolloServer({
  schema,
  context,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
});

exports.graphql = functions.https.onRequest(apolloServer.createHandler());
