import { ICustomField } from '@erxes/api-utils/src/definitions/common';
import { Schema, Document } from 'mongoose';
import { CAR_SELECT_OPTIONS } from './constants';
import { field, schemaHooksWrapper } from './utils';

const getEnum = (fieldName: string): string[] => {
  return CAR_SELECT_OPTIONS[fieldName].map(option => option.value);
};

const attachmentSchema = new Schema(
  {
    name: String,
    url: String,
    type: String,
    size: Number
  },
  { _id: false }
);

const customFieldSchema = new Schema(
  {
    field: { type: String },
    value: { type: Schema.Types.Mixed },
    stringValue: { type: String, optional: true },
    numberValue: { type: Number, optional: true },
    dateValue: { type: Date, optional: true },
    locationValue: {
      type: {
        type: String,
        enum: ['Point'],
        optional: true
      },
      coordinates: {
        type: [Number],
        optional: true
      },
      required: false
    }
  },
  { _id: false }
);

customFieldSchema.index({ locationValue: '2dsphere' });

export interface ICar {
  plateNumber: string;
  vinNumber: string;
  colorCode: string;
  categoryId: string;
  bodyType: string;
  fuelType: string;
  gearBox: string;
  vintageYear: number;
  importYear: number;
  status: string;
  description?: string;
  tagIds: string[];
  mergedIds: string[];
  attachment?: any;
  customFieldsData?: ICustomField[];
}

export interface ICarDocument extends ICar, Document {
  _id: string;
  createdAt: Date;
  modifiedAt: Date;
  ownerId: string;
  searchText: string;
}

export interface ICarCategory {
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  image?: any;
  secondaryImages?: any[];
}

export interface ICarCategoryDocument extends ICarCategory, Document {
  _id: string;
  order?: string;
  createdAt: Date;
}

export const carCategorySchema = schemaHooksWrapper(
  new Schema({
    _id: field({ pkey: true }),
    name: field({ type: String, label: 'Name' }),
    code: field({ type: String, unique: true, label: 'Code' }),
    order: field({ type: String, label: 'Order' }),
    parentId: field({ type: String, optional: true, label: 'Parent' }),
    description: field({
      type: String,
      optional: true,
      label: 'Description'
    }),
    image: field({ type: attachmentSchema }),
    secondaryImages: field({ type: [attachmentSchema] }),
    createdAt: field({
      type: Date,
      default: new Date(),
      label: 'Created at'
    })
  }),
  'erxes_carCategory'
);

export const carSchema = schemaHooksWrapper(
  new Schema({
    _id: field({ pkey: true }),

    createdAt: field({ type: Date, label: 'Created at' }),

    modifiedAt: field({ type: Date, label: 'Modified at' }),

    ownerId: field({ type: String, optional: true, label: 'Owner' }),

    plateNumber: field({
      type: String,
      optional: true,
      label: 'Plate number',
      index: true
    }),

    vinNumber: field({
      type: String,
      label: 'VIN number',
      optional: true,
      index: true
    }),

    colorCode: field({ type: String, label: 'Color code', optional: true }),

    categoryId: field({ type: String, label: 'Category', index: true }),

    bodyType: field({
      type: String,
      enum: getEnum('BODY_TYPES'),
      default: '',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    fuelType: field({
      type: String,
      enum: getEnum('FUEL_TYPES'),
      default: '',
      optional: true,
      label: 'Brand',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    gearBox: field({
      type: String,
      enum: getEnum('GEARBOX'),
      default: '',
      optional: true,
      label: 'Gear box',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.BODY_TYPES
    }),

    vintageYear: field({
      type: Number,
      label: 'Vintage year',
      default: new Date().getFullYear()
    }),

    importYear: field({
      type: Number,
      label: 'Imported year',
      default: new Date().getFullYear()
    }),

    status: field({
      type: String,
      enum: getEnum('STATUSES'),
      default: 'Active',
      optional: true,
      label: 'Status',
      esType: 'keyword',
      selectOptions: CAR_SELECT_OPTIONS.STATUSES,
      index: true
    }),

    description: field({ type: String, optional: true, label: 'Description' }),

    tagIds: field({
      type: [String],
      optional: true,
      label: 'Tags'
    }),

    // Merged car ids
    mergedIds: field({
      type: [String],
      optional: true,
      label: 'Merged companies'
    }),

    searchText: field({ type: String, optional: true, index: true }),

    attachment: field({ type: attachmentSchema }),

    customFieldsData: field({
      type: [customFieldSchema],
      optional: true,
      label: 'Custom fields data'
    })
  }),
  'erxes_cars'
);
