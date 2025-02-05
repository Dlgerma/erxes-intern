import { IUser } from 'modules/auth/types';
import asyncComponent from 'modules/common/components/AsyncComponent';
import DropdownToggle from 'modules/common/components/DropdownToggle';
import Icon from 'modules/common/components/Icon';
import ModalTrigger from 'modules/common/components/ModalTrigger';
import NameCard from 'modules/common/components/nameCard/NameCard';
import { colors } from 'modules/common/styles';
import { __ } from 'modules/common/utils';
import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Search from '../containers/Search';
import { UserHelper, DropNav } from '../styles';
import BrandChooser from './BrandChooser';
import { pluginsOfTopNavigations } from 'pluginUtils';

const Signature = asyncComponent(() =>
  import(
    /* webpackChunkName:"Signature" */ '@erxes/ui-settings/src/email/containers/Signature'
  )
);

const ChangePassword = asyncComponent(() =>
  import(
    /* webpackChunkName:"ChangePassword" */ 'modules/settings/profile/containers/ChangePassword'
  )
);

const UserInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  span {
    float: none;
    margin: 0 5px 0 0;
  }

  i {
    width: 10px;
  }
`;

const NameCardWrapper = styled.div`
  padding: 10px 20px;
`;

export const NavItem = styled.div`
  padding-left: 18px;
  display: table-cell;
  vertical-align: middle;

  > a {
    color: ${colors.textSecondary};
    display: flex;
    align-items: center;

    &:hover {
      color: ${colors.colorSecondary};
    }
  }

  .dropdown-menu {
    min-width: 240px;
  }
`;

const Version = styled.li`
  padding: 0.25rem 1.5rem;

  span:first-child {
    font-weight: bold;
    color: ${colors.colorCoreGray};
  }

  span {
    font-weight: bold;
  }
`;

const QuickNavigation = ({
  logout,
  currentUser,
  showBrands,
  selectedBrands,
  onChangeBrands,
  version
}: {
  logout: () => void;
  currentUser: IUser;
  showBrands: boolean;
  selectedBrands: string[];
  onChangeBrands: (value: string) => void;
  version: string;
}) => {
  const passContent = props => <ChangePassword {...props} />;
  const signatureContent = props => <Signature {...props} />;

  const brands = currentUser.brands || [];

  const brandOptions = brands.map(brand => ({
    value: brand._id,
    label: brand.name || ''
  }));

  let brandsCombo;

  if (showBrands && brands.length > 1) {
    brandsCombo = (
      <NavItem>
        <BrandChooser
          selectedItems={selectedBrands}
          items={brandOptions}
          onChange={onChangeBrands}
        />
      </NavItem>
    );
  }

  return (
    <nav id={'SettingsNav'}>
      {brandsCombo}

      <NavItem>
        <Search />
      </NavItem>
      {pluginsOfTopNavigations()}
      <NavItem>
        <Dropdown alignRight={true}>
          <Dropdown.Toggle as={DropdownToggle} id="dropdown-user">
            <UserHelper>
              <UserInfo>
                <NameCard.Avatar user={currentUser} size={30} />
                <Icon icon="angle-down" size={14} />
              </UserInfo>
            </UserHelper>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <NameCardWrapper>
              <NameCard user={currentUser} />
            </NameCardWrapper>
            <Dropdown.Divider />
            <li>
              <Link to="/profile">{__('My Profile')}</Link>
            </li>
            <li>
              <DropNav>
                {__('Account Settings')}
                <Icon icon="angle-right" />
                <ul>
                  <ModalTrigger
                    title="Change Password"
                    trigger={
                      <li>
                        <a href="#change-password">{__('Change password')}</a>
                      </li>
                    }
                    content={passContent}
                  />

                  <ModalTrigger
                    title="Email signatures"
                    enforceFocus={false}
                    trigger={
                      <li>
                        <a href="#email">{__('Email signatures')}</a>
                      </li>
                    }
                    content={signatureContent}
                  />
                </ul>
              </DropNav>
            </li>
            <Dropdown.Divider />

            <Dropdown.Item onClick={logout}>{__('Sign out')}</Dropdown.Item>
            {version ? (
              <Version>
                <span>version</span> <span>{version}</span>
              </Version>
            ) : null}
          </Dropdown.Menu>
        </Dropdown>
      </NavItem>
    </nav>
  );
};

export default QuickNavigation;
