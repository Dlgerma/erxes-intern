import { getSyncLogDoc, toErkhet } from './utils';
import { sendRequest } from '@erxes/api-utils/src/requests';

export const customerToErkhet = async (models, params, action) => {
  const syncLogDoc = getSyncLogDoc(params);
  const configs = await models.Configs.getConfig('erkhetConfig', {});

  const configBrandIds = Object.keys(configs);
  if (!configBrandIds.length) {
    return;
  }

  const customer = params.updatedDocument || params.object;
  const oldCustomer = params.object;
  let sendData = {};

  let name = customer.primaryName || '';

  name =
    name && customer.firstName
      ? name.concat(' - ').concat(customer.firstName || '')
      : name || customer.firstName || '';
  name =
    name && customer.lastName
      ? name.concat(' - ').concat(customer.lastName || '')
      : name || customer.lastName || '';

  for (const brandId of configBrandIds) {
    const config = configs[brandId];
    name = name ? name : config.customerDefaultName;

    const syncLog = await models.SyncLogs.syncLogsAdd(syncLogDoc);
    try {
      sendData = {
        action,
        oldCode: oldCustomer.code || customer.code || '',
        object: {
          code: customer.code || '',
          name,
          defaultCategory: (config.customerCategoryCode || '').toString(),
          email: customer.primaryEmail || '',
          phone: customer.primaryPhone || ''
        }
      };

      toErkhet(models, syncLog, config, sendData, 'customer-change');
    } catch (e) {
      await models.SyncLogs.updateOne(
        { _id: syncLog._id },
        { $set: { error: e.message } }
      );
    }
  }
};

export const validCompanyCode = async (config, companyCode) => {
  let result = false;
  if (
    !config ||
    !config.checkCompanyUrl ||
    !config.checkCompanyUrl.includes('http')
  ) {
    return result;
  }

  const re = new RegExp('(^[А-ЯЁӨҮ]{2}[0-9]{8}$)|(^\\d{7}$)', 'gui');

  if (re.test(companyCode)) {
    const response = await sendRequest({
      url: config.checkCompanyUrl,
      method: 'GET',
      params: { regno: companyCode }
    });

    if (response.found) {
      result = response.name;
    }
  }
  return result;
};

export const companyToErkhet = async (models, params, action) => {
  const syncLogDoc = getSyncLogDoc(params);
  const configs = await models.Configs.getConfig('erkhetConfig', {});

  const configBrandIds = Object.keys(configs);
  if (!configBrandIds.length) {
    return;
  }

  const company = params.updatedDocument || params.object;

  const oldCompany = params.object;

  for (const brandId of configBrandIds) {
    const config = configs[brandId];

    const syncLog = await models.SyncLogs.syncLogsAdd(syncLogDoc);
    try {
      const sendData = {
        action,
        oldCode: oldCompany.code || company.code || '',
        object: {
          code: company.code || '',
          name: company.primaryName,
          defaultCategory: config.companyCategoryCode,
          email: company.primaryEmail || '',
          phone: company.primaryPhone || ''
        }
      };

      toErkhet(models, syncLog, config, sendData, 'customer-change');
    } catch (e) {
      await models.SyncLogs.updateOne(
        { _id: syncLog._id },
        { $set: { error: e.message } }
      );
    }
  }
};
