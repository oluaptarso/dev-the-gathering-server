import * as functions from 'firebase-functions';
import { ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-cloud-functions';
import { schema } from './schema';
import { context } from './context';

const introspection = process.env.GRAPHQL_PLAYGROUND === 'true';

const apolloServer = new ApolloServer({
  schema,
  context,
  introspection,
  plugins: [introspection ? ApolloServerPluginLandingPageGraphQLPlayground : ApolloServerPluginLandingPageLocalDefault],
});

exports.graphql = functions.https.onRequest(apolloServer.createHandler());
