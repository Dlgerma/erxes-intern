import { Alert, __, confirm, router } from '@erxes/ui/src/utils';
import { Count, Title } from '@erxes/ui/src/styles/main';
import { IProduct, IProductCategory } from '../../types';

import { BarItems } from '@erxes/ui/src/layout/styles';
import Button from '@erxes/ui/src/components/Button';
import CategoryList from '../../containers/productCategory/CategoryList';
import EmptyState from '@erxes/ui/src/components/EmptyState';
import Form from '@erxes/ui-products/src/containers/ProductForm';
import FormControl from '@erxes/ui/src/components/form/Control';
import HeaderDescription from '@erxes/ui/src/components/HeaderDescription';
import { IRouterProps } from '@erxes/ui/src/types';
import { Link } from 'react-router-dom';
import ModalTrigger from '@erxes/ui/src/components/ModalTrigger';
import Pagination from '@erxes/ui/src/components/pagination/Pagination';
import ProductsMerge from './detail/ProductsMerge';
import ProductsPrintAction from './ProductPrintAction';
import React from 'react';
import Row from './ProductRow';
import Spinner from '@erxes/ui/src/components/Spinner';
import { TAG_TYPES } from '@erxes/ui-tags/src/constants';
import Table from '@erxes/ui/src/components/table';
import TaggerPopover from '@erxes/ui-tags/src/components/TaggerPopover';
import TemporarySegment from '@erxes/ui-segments/src/components/filter/TemporarySegment';
import Wrapper from '@erxes/ui/src/layout/components/Wrapper';
import { isEnabled } from '@erxes/ui/src/utils/core';
import { FlexItem, InputBar } from '@erxes/ui-settings/src/styles';
import { Icon } from '@erxes/ui/src';

interface IProps extends IRouterProps {
  history: any;
  queryParams: any;
  products: IProduct[];
  productsCount: number;
  isAllSelected: boolean;
  bulk: any[];
  emptyBulk: () => void;
  remove: (doc: { productIds: string[] }, emptyBulk: () => void) => void;
  toggleBulk: () => void;
  toggleAll: (targets: IProduct[], containerId: string) => void;
  loading: boolean;
  searchValue: string;
  currentCategory: IProductCategory;
  mergeProducts: () => void;
  mergeProductLoading;
}

type State = {
  searchValue?: string;
  checked?: boolean;
};

class List extends React.Component<IProps, State> {
  private timer?: NodeJS.Timer;

  constructor(props) {
    super(props);

    this.state = {
      searchValue: this.props.searchValue,
      checked: false
    };
  }

  renderRow = () => {
    const { products, history, toggleBulk, bulk } = this.props;

    return products.map(product => (
      <Row
        history={history}
        key={product._id}
        product={product}
        toggleBulk={toggleBulk}
        isChecked={(bulk || []).map(b => b._id).includes(product._id)}
      />
    ));
  };

  onChange = () => {
    const { toggleAll, products, bulk, history } = this.props;
    toggleAll(products, 'products');

    if (bulk.length === products.length) {
      router.removeParams(history, 'ids');
      router.setParams(history, { page: 1 });
    }
  };

  removeProducts = products => {
    const productIds: string[] = [];

    products.forEach(product => {
      productIds.push(product._id);
    });

    this.props.remove({ productIds }, this.props.emptyBulk);
  };

  search = e => {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const { history } = this.props;
    const searchValue = e.target.value;

    this.setState({ searchValue });

    this.timer = setTimeout(() => {
      router.removeParams(history, 'page');
      router.setParams(history, { searchValue });
    }, 500);
  };

  moveCursorAtTheEnd(e) {
    const tmpValue = e.target.value;

    e.target.value = '';
    e.target.value = tmpValue;
  }

  onChangeChecked = e => {
    const { bulk, history } = this.props;
    const checked = e.target.checked;

    if (checked && (bulk || []).length) {
      this.setState({ checked: true });
      this.setState({ searchValue: '' });
      router.removeParams(history, 'page', 'searchValue', 'categoryId');
      router.setParams(history, {
        ids: (bulk || []).map(b => b._id).join(',')
      });
    } else {
      this.setState({ checked: false });
      router.removeParams(history, 'page', 'ids');
    }
  };

  renderContent = () => {
    const {
      productsCount,
      loading,
      isAllSelected,
      currentCategory
    } = this.props;

    if (loading) {
      return <Spinner objective={true} />;
    }

    if (currentCategory.productCount === 0) {
      return (
        <EmptyState
          image="/images/actions/8.svg"
          text="No Brands"
          size="small"
        />
      );
    }

    return (
      <>
        <Table hover={true}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>
                <FormControl
                  checked={isAllSelected}
                  componentClass="checkbox"
                  onChange={this.onChange}
                />
              </th>
              <th>{__('Code')}</th>
              <th>{__('Name')}</th>
              <th>{__('Type')}</th>
              <th>{__('Category')}</th>
              <th>{__('Unit Price')}</th>
              <th>{__('Tags')}</th>
              <th>{__('Actions')}</th>
            </tr>
          </thead>
          <tbody>{this.renderRow()}</tbody>
        </Table>
      </>
    );
  };

  render() {
    const {
      productsCount,
      queryParams,
      history,
      bulk,
      emptyBulk,
      currentCategory,
      mergeProducts,
      mergeProductLoading
    } = this.props;

    const breadcrumb = [
      { title: __('Settings'), link: '/settings' },
      { title: __('Product & Service') }
    ];

    const trigger = (
      <Button btnStyle="success" icon="plus-circle">
        Add items
      </Button>
    );

    const modalContent = props => <Form {...props} />;

    const productsMerge = props => {
      return (
        <ProductsMerge
          {...props}
          objects={bulk}
          save={mergeProducts}
          mergeProductLoading={mergeProductLoading}
        />
      );
    };

    const actionBarRight = () => {
      if (bulk.length > 0) {
        const onClick = () =>
          confirm()
            .then(() => {
              this.removeProducts(bulk);
            })
            .catch(error => {
              Alert.error(error.message);
            });

        const mergeButton = (
          <Button btnStyle="success" icon="merge">
            Merge
          </Button>
        );

        const tagButton = (
          <Button btnStyle="success" icon="tag-alt">
            Tag
          </Button>
        );

        return (
          <BarItems>
            {bulk.length === 2 && (
              <ModalTrigger
                title="Merge Product"
                size="lg"
                dialogClassName="modal-1000w"
                trigger={mergeButton}
                content={productsMerge}
              />
            )}
            <ProductsPrintAction bulk={this.props.bulk} />
            {isEnabled('tags') && (
              <TaggerPopover
                type={TAG_TYPES.PRODUCT}
                successCallback={emptyBulk}
                targets={bulk}
                trigger={tagButton}
                perPage={1000}
                refetchQueries={['productCountByTags']}
              />
            )}

            <Button btnStyle="danger" icon="cancel-1" onClick={onClick}>
              Remove
            </Button>
          </BarItems>
        );
      }

      return (
        <BarItems>
          <InputBar type="searchBar">
            <Icon icon="search-1" size={20} />
            <FlexItem>
              <FormControl
                type="text"
                placeholder={__('Type to search')}
                onChange={this.search}
                value={this.state.searchValue}
                autoFocus={true}
                onFocus={this.moveCursorAtTheEnd}
              />
            </FlexItem>
          </InputBar>
          {isEnabled('segments') && (
            <TemporarySegment
              btnSize="medium"
              contentType={`products:product`}
            />
          )}
          <Link to="/settings/importHistories?type=product">
            <Button btnStyle="simple" icon="arrow-from-right">
              {__('Import items')}
            </Button>
          </Link>
          <ModalTrigger
            title="Add Product/Services"
            trigger={trigger}
            autoOpenKey="showProductModal"
            content={modalContent}
            size="lg"
          />
        </BarItems>
      );
    };

    const actionBarLeft = (
      <Title>{`${currentCategory.name ||
        'All products'} (${productsCount})`}</Title>
    );

    return (
      <Wrapper
        header={
          <Wrapper.Header
            title={__('Product & Service')}
            queryParams={queryParams}
            breadcrumb={breadcrumb}
          />
        }
        mainHead={
          <HeaderDescription
            icon="/images/actions/30.svg"
            title={'Product & Service'}
            description={`${__(
              'All information and know-how related to your business products and services are found here'
            )}.${__(
              'Create and add in unlimited products and servicess so that you and your team members can edit and share'
            )}`}
          />
        }
        actionBar={
          <Wrapper.ActionBar left={actionBarLeft} right={actionBarRight()} />
        }
        leftSidebar={
          <CategoryList queryParams={queryParams} history={history} />
        }
        footer={<Pagination count={productsCount} />}
        content={this.renderContent()}
        transparent={true}
        hasBorder={true}
      />
    );
  }
}

export default List;
