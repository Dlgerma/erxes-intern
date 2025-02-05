import {
  checkPermission,
  requireLogin
} from '@erxes/api-utils/src/permissions';
import { afterQueryWrapper, paginate } from '@erxes/api-utils/src';
import { PRODUCT_STATUSES } from '../../../models/definitions/products';
import { escapeRegExp } from '@erxes/api-utils/src/core';
import { IContext, IModels } from '../../../connectionResolver';
import messageBroker, { sendTagsMessage } from '../../../messageBroker';
import {
  getSimilaritiesProducts,
  getSimilaritiesProductsCount
} from '../../../maskUtils';
import { Builder, countBySegment, countByTag } from '../../../utils';

interface IQueryParams {
  ids?: string[];
  excludeIds?: boolean;
  type?: string;
  status?: string;
  categoryId?: string;
  searchValue?: string;
  vendorId?: string;
  brand?: string;
  tag: string;
  page?: number;
  perPage?: number;
  sortField?: string;
  sortDirection?: number;
  pipelineId?: string;
  boardId?: string;
  segment?: string;
  segmentData?: string;
  groupedSimilarity?: string;
}

const generateFilter = async (
  subdomain,
  models,
  commonQuerySelector,
  params
) => {
  const {
    type,
    categoryId,
    searchValue,
    vendorId,
    brand,
    tag,
    ids,
    excludeIds,
    segment,
    segmentData
  } = params;
  const filter: any = commonQuerySelector;

  filter.status = { $ne: PRODUCT_STATUSES.DELETED };

  if (params.status) {
    filter.status = params.status;
  }
  if (type) {
    filter.type = type;
  }

  if (categoryId) {
    const category = await models.ProductCategories.getProductCategory({
      _id: categoryId,
      status: { $in: [null, 'active'] }
    });

    const productCategoryIds = await models.ProductCategories.find(
      { order: { $regex: new RegExp(`^${category.order}`) } },
      { _id: 1 }
    );
    filter.categoryId = { $in: productCategoryIds };
  } else {
    const notActiveCategories = await models.ProductCategories.find({
      status: { $nin: [null, 'active'] }
    });

    filter.categoryId = { $nin: notActiveCategories.map(e => e._id) };
  }

  if (ids && ids.length > 0) {
    filter._id = { [excludeIds ? '$nin' : '$in']: ids };
  }

  if (tag) {
    filter.tagIds = { $in: [tag] };
  }

  // search =========
  if (searchValue) {
    const regex = new RegExp(`.*${escapeRegExp(searchValue)}.*`, 'i');
    const codeRegex = new RegExp(
      `^${searchValue
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.')
        .replace(/_/g, '.')}.*`,
      'igu'
    );

    filter.$or = [
      {
        $or: [{ code: { $in: [regex] } }, { code: { $in: [codeRegex] } }]
      },
      { name: { $in: [regex] } },
      { barcodes: { $in: [searchValue] } }
    ];
  }

  if (segment || segmentData) {
    const qb = new Builder(models, subdomain, { segment, segmentData }, {});

    await qb.buildAllQueries();

    const { list } = await qb.runQueries();

    filter._id = { $in: list.map(l => l._id) };
  }

  if (vendorId) {
    filter.vendorId = vendorId;
  }

  if (brand) {
    filter.scopeBrandIds = { $in: [brand] };
  }

  return filter;
};

const generateFilterCat = async ({
  models,
  parentId,
  withChild,
  searchValue,
  meta,
  brand,
  status
}) => {
  const filter: any = {};
  filter.status = { $nin: ['disabled', 'archived'] };

  if (status && status !== 'active') {
    filter.status = status;
  }

  if (parentId) {
    if (withChild) {
      const category = await (models as IModels).ProductCategories.getProductCategory(
        {
          _id: parentId
        }
      );

      const relatedCategoryIds = (
        await models.ProductCategories.find(
          { order: { $regex: new RegExp(`^${category.order}`) } },
          { _id: 1 }
        ).lean()
      ).map(c => c._id);

      filter.parentId = { $in: relatedCategoryIds };
    } else {
      filter.parentId = parentId;
    }
  }

  if (brand) {
    filter.scopeBrandIds = { $in: [brand] };
  }

  if (meta) {
    if (!isNaN(meta)) {
      filter.meta = { $lte: Number(meta) };
    } else {
      filter.meta = meta;
    }
  }

  if (searchValue) {
    filter.name = new RegExp(`.*${searchValue}.*`, 'i');
  }

  return filter;
};

const productQueries = {
  /**
   * Products list
   */
  async products(
    _root,
    params: IQueryParams,
    { commonQuerySelector, models, subdomain, user }: IContext
  ) {
    const filter = await generateFilter(
      subdomain,
      models,
      commonQuerySelector,
      params
    );

    const { sortField, sortDirection, page, perPage, ids, excludeIds } = params;

    const pagintationArgs = { page, perPage };
    if (
      ids &&
      ids.length &&
      !excludeIds &&
      ids.length > (pagintationArgs.perPage || 20)
    ) {
      pagintationArgs.page = 1;
      pagintationArgs.perPage = ids.length;
    }

    let sort: any = { code: 1 };
    if (sortField) {
      sort = { [sortField]: sortDirection || 1 };
    }

    if (params.groupedSimilarity) {
      return await getSimilaritiesProducts(models, filter, params);
    }

    return afterQueryWrapper(
      subdomain,
      'products',
      params,
      await paginate(
        models.Products.find(filter)
          .sort(sort)
          .lean(),
        pagintationArgs
      ),
      messageBroker(),
      user
    );
  },

  async productsTotalCount(
    _root,
    params: IQueryParams,
    { commonQuerySelector, models, subdomain }: IContext
  ) {
    const filter = await generateFilter(
      subdomain,
      models,
      commonQuerySelector,
      params
    );

    if (params.groupedSimilarity) {
      return await getSimilaritiesProductsCount(models, filter, params);
    }

    return models.Products.find(filter).count();
  },

  /**
   * Group product counts by segment or tag
   */
  async productsGroupCounts(
    _root,
    params,
    { commonQuerySelector, commonQuerySelectorElk, models, subdomain }: IContext
  ) {
    const counts = {
      bySegment: {},
      byTag: {}
    };

    const { only } = params;

    const qb = new Builder(models, subdomain, params, {
      commonQuerySelector,
      commonQuerySelectorElk
    });

    switch (only) {
      case 'byTag':
        counts.byTag = await countByTag(subdomain, 'products:product', qb);
        break;

      case 'bySegment':
        counts.bySegment = await countBySegment(
          subdomain,
          'products:product',
          qb
        );
        break;
    }

    return counts;
  },

  async productSimilarities(
    _root,
    { _id, groupedSimilarity },
    { models }: IContext
  ) {
    const product = await models.Products.getProduct({ _id });

    if (groupedSimilarity === 'config') {
      const getRegex = str => {
        return new RegExp(
          `^${str
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.')
            .replace(/_/g, '.')}.*`,
          'igu'
        );
      };

      const similarityGroups = await models.ProductsConfigs.getConfig(
        'similarityGroup'
      );

      const codeMasks = Object.keys(similarityGroups);
      const customFieldIds = (product.customFieldsData || []).map(
        cf => cf.field
      );

      const matchedMasks = codeMasks.filter(
        cm =>
          product.code.match(getRegex(cm)) &&
          (similarityGroups[cm].rules || [])
            .map(sg => sg.fieldId)
            .filter(sgf => customFieldIds.includes(sgf)).length ===
            (similarityGroups[cm].rules || []).length
      );

      if (!matchedMasks.length) {
        return {
          products: await models.Products.find({ _id })
        };
      }

      const codeRegexs: any[] = [];
      const fieldIds: string[] = [];
      const groups: { title: string; fieldId: string }[] = [];
      for (const matchedMask of matchedMasks) {
        codeRegexs.push({ code: { $in: [getRegex(matchedMask)] } });

        for (const rule of similarityGroups[matchedMask].rules || []) {
          const { fieldId, title } = rule;
          if (!fieldIds.includes(fieldId)) {
            fieldIds.push(fieldId);
            groups.push({ title, fieldId });
          }
        }
      }

      const filters: any = {
        $and: [
          {
            $or: codeRegexs,
            'customFieldsData.field': { $in: fieldIds }
          }
        ]
      };

      return {
        products: await models.Products.find(filters).sort({ code: 1 }),
        groups
      };
    }

    const category = await models.ProductCategories.getProductCategory({
      _id: product.categoryId
    });
    if (
      !category.isSimilarity ||
      !category.similarities ||
      !category.similarities.length
    ) {
      return {
        products: await models.Products.find({ _id })
      };
    }

    const fieldIds = category.similarities.map(r => r.fieldId);
    const filters: any = {
      $and: [
        {
          categoryId: category._id,
          'customFieldsData.field': { $in: fieldIds }
        }
      ]
    };

    const groups: {
      title: string;
      fieldId: string;
    }[] = category.similarities.map(r => ({ ...r }));

    return {
      products: await models.Products.find(filters).sort({ code: 1 }),
      groups
    };
  },

  async productCategories(
    _root,
    { parentId, withChild, searchValue, status, brand, meta },
    { models }: IContext
  ) {
    const filter = await generateFilterCat({
      models,
      status,
      parentId,
      withChild,
      searchValue,
      brand,
      meta
    });

    const sortParams: any = { order: 1 };

    return await models.ProductCategories.find(filter)
      .sort(sortParams)
      .lean();
  },

  async productCategoriesTotalCount(
    _root,
    { parentId, searchValue, status, withChild, brand, meta },
    { models }: IContext
  ) {
    const filter = await generateFilterCat({
      models,
      parentId,
      withChild,
      searchValue,
      status,
      brand,
      meta
    });
    return models.ProductCategories.find(filter).countDocuments();
  },

  productDetail(_root, { _id }: { _id: string }, { models }: IContext) {
    return models.Products.findOne({ _id }).lean();
  },

  productCategoryDetail(_root, { _id }: { _id: string }, { models }: IContext) {
    return models.ProductCategories.findOne({ _id }).lean();
  },

  async productCountByTags(_root, _params, { models, subdomain }: IContext) {
    const counts = {};

    // Count products by tag =========
    const tags = await sendTagsMessage({
      subdomain,
      action: 'find',
      data: {
        type: 'products:product'
      },
      isRPC: true,
      defaultValue: []
    });

    for (const tag of tags) {
      counts[tag._id] = await models.Products.find({
        tagIds: tag._id,
        status: { $ne: PRODUCT_STATUSES.DELETED }
      }).countDocuments();
    }

    return counts;
  }
};

requireLogin(productQueries, 'productsTotalCount');
checkPermission(productQueries, 'products', 'showProducts', []);
checkPermission(productQueries, 'productCategories', 'showProducts', []);
checkPermission(productQueries, 'productCountByTags', 'showProducts', []);

export default productQueries;
