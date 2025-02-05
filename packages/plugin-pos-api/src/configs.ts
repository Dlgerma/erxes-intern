import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { generateModels } from './connectionResolver';

import { initBroker } from './messageBroker';
import { getSubdomain } from '@erxes/api-utils/src/core';
import * as permissions from './permissions';
import { posInit, posSyncConfig, unfetchOrderInfo } from './routes';
import afterMutations from './afterMutations';
import beforeResolvers from './beforeResolvers';
import automations from './automations';
import forms from './forms';
import segments from './segments';
import dashboards from './dashboards';
import imports from './imports';
import exporter from './exporter';
import payment from './payment';
import { exportFileRunner } from './exporterByUrl';
export let debug;
export let graphqlPubsub;
export let mainDb;
export let serviceDiscovery;

export default {
  name: 'pos',
  permissions,
  getHandlers: [
    { path: `/pos-init`, method: posInit },
    { path: `/pos-sync-config`, method: posSyncConfig },
    { path: `/file-export`, method: exportFileRunner }
  ],
  postHandlers: [{ path: `/api/unfetch-order-info`, method: unfetchOrderInfo }],
  graphql: async sd => {
    serviceDiscovery = sd;
    return {
      typeDefs: await typeDefs(sd),
      resolvers: await resolvers(sd)
    };
  },
  apolloServerContext: async (context, req) => {
    const subdomain = getSubdomain(req);

    context.subdomain = subdomain;
    context.models = await generateModels(subdomain);

    return context;
  },

  onServerInit: async options => {
    mainDb = options.db;

    initBroker(options.messageBrokerClient);

    debug = options.debug;
    graphqlPubsub = options.pubsubClient;
  },
  meta: {
    afterMutations,
    automations,
    forms,
    segments,
    permissions,
    dashboards,
    beforeResolvers,
    imports,
    exporter,
    payment
  }
};
