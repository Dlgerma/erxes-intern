import * as dotenv from 'dotenv';

import {
  instagramCreateIntegration,
  removeAccount,
  removeCustomers,
  removeIntegration,
  repairIntegrations
} from './helpers';
import { handleInstagramMessage } from './handleInstagramMessage';
import { userIds } from './middlewares/userMiddleware';

import {
  ISendMessageArgs,
  sendMessage as sendCommonMessage
} from '@erxes/api-utils/src/core';

import { serviceDiscovery } from './configs';
import { generateModels } from './connectionResolver';

dotenv.config();

let client;

export const sendRPCMessage = async (message): Promise<any> => {
  return client.sendRPCMessage('rpc_queue:integrations_to_api', message);
};

export const initBroker = async cl => {
  client = cl;

  const { consumeRPCQueue, consumeQueue } = client;

  consumeRPCQueue(
    'instagram:getAccounts',
    async ({ subdomain, data: { kind } }) => {
      const models = await generateModels(subdomain);

      const selector = { kind };

      return {
        data: await models.Accounts.find(selector).lean(),
        status: 'success'
      };
    }
  );

  // listen for rpc queue =========
  consumeRPCQueue(
    'instagram:api_to_integrations',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      const { action, type } = data;

      let response: any = null;
      try {
        if (action === 'remove-account') {
          response = { data: await removeAccount(models, data._id) };
        }

        if (action === 'repair-integrations') {
          response = { data: await repairIntegrations(models, data._id) };
        }

        if (action === 'reply-messenger') {
          response = { data: await handleInstagramMessage(models, data) };
        }
        if (action === 'getConfigs') {
          response = { data: await models.Configs.find({}) };
        }
        response.status = 'success';
      } catch (e) {
        response = {
          status: 'error',
          errorMessage: e.message
        };
      }

      return response;
    }
  );

  // /instagram/get-status'
  consumeRPCQueue(
    'instagram:getStatus',
    async ({ subdomain, data: { integrationId } }) => {
      const models = await generateModels(subdomain);

      const integration = await models.Integrations.findOne({
        erxesApiId: integrationId
      });

      let result = {
        status: 'healthy'
      } as any;

      if (integration) {
        result = {
          status: integration.healthStatus || 'healthy',
          error: integration.error
        };
      }

      return {
        data: result,
        status: 'success'
      };
    }
  );

  consumeRPCQueue(
    'instagram:createIntegration',
    async ({ subdomain, data: { doc, kind } }) => {
      const models = await generateModels(subdomain);

      if (kind === 'instagram') {
        return instagramCreateIntegration(models, doc);
      }

      return {
        status: 'error',
        data: 'Wrong kind'
      };
    }
  );

  // '/integrations/remove',
  consumeRPCQueue(
    'instagram:removeIntegrations',
    async ({ subdomain, data: { integrationId } }) => {
      const models = await generateModels(subdomain);

      await removeIntegration(models, integrationId);

      return { status: 'success' };
    }
  );

  consumeQueue('instagram:notification', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    const { payload, type } = data;
    switch (type) {
      case 'removeCustomers':
        await removeCustomers(models, data);
        break;
      case 'addUserId':
        userIds.push(payload._id);
        break;
      default:
        break;
    }
  });

  consumeRPCQueue(
    'instagram:conversationMessages.find',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.ConversationMessages.find(data).lean()
      };
    }
  );
};

export default function() {
  return client;
}

export const sendInboxMessage = (args: ISendMessageArgs) => {
  return sendCommonMessage({
    client,
    serviceDiscovery,
    serviceName: 'inbox',
    ...args
  });
};
