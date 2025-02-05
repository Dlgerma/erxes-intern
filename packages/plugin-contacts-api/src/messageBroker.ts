import {
  findCompany,
  findCustomer,
  getContentItem,
  prepareEngageCustomers
} from './utils';
import { serviceDiscovery } from './configs';
import { generateModels } from './connectionResolver';
import { ISendMessageArgs, sendMessage } from '@erxes/api-utils/src/core';
import { getNumberOfVisits } from './events';
import {
  AWS_EMAIL_STATUSES,
  EMAIL_VALIDATION_STATUSES,
  MODULE_NAMES
} from './constants';
import { updateContactsField } from './utils';
import { sendToWebhook as sendWebhook } from '@erxes/api-utils/src';
import { putCreateLog } from './logUtils';

export let client;

const createOrUpdate = async ({
  collection,
  data: { rows, doNotReplaceExistingValues }
}) => {
  const operations: any = [];

  for (const row of rows) {
    const { selector, doc, customFieldsData } = row;

    const prevEntry = await collection.findOne(selector).lean();

    if (prevEntry) {
      let cfData = prevEntry.customFieldsData || [];

      // remove existing rows
      for (const cf of customFieldsData || []) {
        cfData = cfData.filter(({ field }) => field !== cf.field);
      }

      // add new rows
      for (const cf of customFieldsData || []) {
        cfData.push(cf);
      }

      let newDoc = doc;

      if (doNotReplaceExistingValues) {
        for (const fieldName of Object.keys(doc)) {
          if (prevEntry[fieldName]) {
            delete newDoc[fieldName];
          }
        }
      }

      newDoc.customFieldsData = cfData;

      operations.push({
        updateOne: { filter: selector, update: { $set: newDoc } }
      });
    } else {
      doc.customFieldsData = customFieldsData;
      doc.createdAt = new Date();
      doc.modifiedAt = new Date();
      operations.push({ insertOne: { document: doc } });
    }
  }

  return collection.bulkWrite(operations);
};

export const initBroker = cl => {
  client = cl;

  const { consumeRPCQueue, consumeQueue } = client;

  consumeRPCQueue('contacts:customers.findOne', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    return {
      status: 'success',
      data: await findCustomer(models, subdomain, data)
    };
  });

  consumeRPCQueue(
    'contacts:customers.count',
    async ({ subdomain, data: { selector } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.count(selector)
      };
    }
  );

  consumeRPCQueue('contacts:companies.findOne', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    return {
      status: 'success',
      data: await findCompany(models, subdomain, data)
    };
  });

  consumeRPCQueue('contacts:companies.find', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    return {
      status: 'success',
      data: await models.Companies.find(data).lean()
    };
  });

  consumeRPCQueue('contacts:customers.find', async ({ subdomain, data }) => {
    const models = await generateModels(subdomain);

    return {
      status: 'success',
      data: await models.Customers.find(data).lean()
    };
  });

  consumeRPCQueue(
    'contacts:customers.getCustomerIds',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.find(data).distinct('_id')
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.findActiveCustomers',
    async ({ subdomain, data: { selector, fields, skip, limit } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.findActiveCustomers(
          selector,
          fields,
          skip,
          limit
        )
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.getCompanyName',
    async ({ subdomain, data: { company } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Companies.getCompanyName(company)
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.findActiveCompanies',
    async ({ subdomain, data: { selector, fields, skip, limit } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Companies.findActiveCompanies(
          selector,
          fields,
          skip,
          limit
        )
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.createCustomer',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.createCustomer(data)
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.createCompany',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Companies.createCompany(data)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.updateCustomer',
    async ({ subdomain, data: { _id, doc } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.updateCustomer(_id, doc)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.updateOne',
    async ({ subdomain, data: { selector, modifier } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.updateOne(selector, modifier)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.updateMany',
    async ({ subdomain, data: { selector, modifier } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.updateMany(selector, modifier)
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.updateMany',
    async ({ subdomain, data: { selector, modifier } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Companies.updateMany(selector, modifier)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.markCustomerAsActive',
    async ({ subdomain, data: { customerId } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.markCustomerAsActive(customerId)
      };
    }
  );

  consumeQueue(
    'contacts:customers.removeCustomers',
    async ({ subdomain, data: { customerIds } }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.removeCustomers(customerIds)
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.updateCompany',
    async ({ subdomain, data: { _id, doc } }) => {
      const { Companies } = await generateModels(subdomain);

      return {
        status: 'success',
        data: await Companies.updateCompany(_id, doc)
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.removeCompanies',
    async ({ subdomain, data: { _ids } }) => {
      const { Companies } = await generateModels(subdomain);

      return {
        status: 'success',
        data: await Companies.removeCompanies(_ids)
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.updateCommon',
    async ({ subdomain, data: { selector, modifier } }) => {
      const { Companies } = await generateModels(subdomain);

      return {
        status: 'success',
        data: await Companies.updateOne(selector, modifier)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.getWidgetCustomer',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.getWidgetCustomer(data)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.updateMessengerCustomer',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.updateMessengerCustomer(data)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.createMessengerCustomer',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      const customer = await models.Customers.createMessengerCustomer(data);

      await putCreateLog(
        models,
        subdomain,
        {
          type: MODULE_NAMES.CUSTOMER,
          newData: customer,
          object: customer
        },
        null
      );

      return {
        status: 'success',
        data: customer
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.saveVisitorContactInfo',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await models.Customers.saveVisitorContactInfo(data)
      };
    }
  );

  consumeQueue(
    'contacts:customers.updateLocation',
    async ({ subdomain, data: { customerId, browserInfo } }) => {
      const models = await generateModels(subdomain);

      await models.Customers.updateLocation(customerId, browserInfo);
    }
  );

  consumeQueue(
    'contacts:customers.updateSession',
    async ({ subdomain, data: { customerId } }) => {
      const models = await generateModels(subdomain);

      await models.Customers.updateSession(customerId);
    }
  );

  consumeRPCQueue(
    'contacts:customers.getCustomerName',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        data: models.Customers.getCustomerName(data),
        status: 'success'
      };
    }
  );

  consumeRPCQueue('contacts.getContentItem', async data => {
    const models = await generateModels('os');
    return {
      status: 'success',
      data: await getContentItem(models, data)
    };
  });

  consumeRPCQueue(
    'contacts:customers.prepareEngageCustomers',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await prepareEngageCustomers(models, subdomain, data)
      };
    }
  );

  consumeRPCQueue('contacts:getNumberOfVisits', async ({ data }) => ({
    status: 'success',
    data: await getNumberOfVisits(data)
  }));

  consumeQueue(
    'contacts:customers.setUnsubscribed',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      const { customerIds = [], status, _id } = data;

      const update: any = { isSubscribed: 'No' };

      if (status === AWS_EMAIL_STATUSES.BOUNCE) {
        update.emailValidationStatus = EMAIL_VALIDATION_STATUSES.INVALID;
      }

      if (_id && status) {
        return {
          status: 'success',
          data: await models.Customers.updateOne({ _id }, { $set: update })
        };
      }

      if (customerIds.length > 0 && !status) {
        return {
          status: 'success',
          data: await models.Customers.updateMany(
            { _id: { $in: customerIds } },
            { $set: update }
          )
        };
      }
    }
  );

  consumeRPCQueue(
    'contacts:updateContactsField',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await updateContactsField(models, subdomain, data)
      };
    }
  );

  consumeRPCQueue(
    'contacts:customers.createOrUpdate',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await createOrUpdate({ collection: models.Customers, data })
      };
    }
  );

  consumeRPCQueue(
    'contacts:companies.createOrUpdate',
    async ({ subdomain, data }) => {
      const models = await generateModels(subdomain);

      return {
        status: 'success',
        data: await createOrUpdate({ collection: models.Companies, data })
      };
    }
  );
};

export const sendSegmentsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'segments',
    ...args
  });
};

export const sendCoreMessage = async (args: ISendMessageArgs): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'core',
    ...args
  });
};

export const sendFormsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'forms',
    ...args
  });
};

export const sendInboxMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'inbox',
    ...args
  });
};

export const sendEngagesMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'engages',
    ...args
  });
};

export const sendInternalNotesMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'internalnotes',
    ...args
  });
};

export const sendTagsMessage = async (args: ISendMessageArgs): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'tags',
    ...args
  });
};

export const sendContactsMessage = async (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'contacts',
    ...args
  });
};

export const sendCommonMessage = async (
  args: ISendMessageArgs & { serviceName: string }
): Promise<any> => {
  return sendMessage({
    serviceDiscovery,
    client,
    ...args
  });
};

export const sendIntegrationsMessage = (
  args: ISendMessageArgs
): Promise<any> => {
  return sendMessage({
    client,
    serviceDiscovery,
    serviceName: 'integrations',
    ...args
  });
};

export const fetchSegment = (
  subdomain: string,
  segmentId: string,
  options?,
  segmentData?: any
) =>
  sendSegmentsMessage({
    subdomain,
    action: 'fetchSegment',
    data: { segmentId, options, segmentData },
    isRPC: true
  });

export const sendToWebhook = ({ subdomain, data }) => {
  return sendWebhook(client, { subdomain, data });
};

export default function() {
  return client;
}
