import {
  MainStyleFormColumn as FormColumn,
  MainStyleFormWrapper as FormWrapper,
  MainStyleModalFooter as ModalFooter,
  MainStyleScrollWrapper as ScrollWrapper
} from '@erxes/ui/src/styles/eindex';

import Button from '@erxes/ui/src/components/Button';
import ControlLabel from '@erxes/ui/src/components/form/Label';
import DateControl from '@erxes/ui/src/components/form/DateControl';
import Form from '@erxes/ui/src/components/form/Form';
import FormControl from '@erxes/ui/src/components/form/Control';
import FormGroup from '@erxes/ui/src/components/form/Group';
import SelectTeamMembers from '@erxes/ui/src/team/containers/SelectTeamMembers';
import { TabTitle, Tabs as MainTabs } from '@erxes/ui/src/components/tabs';
import Table from '@erxes/ui/src/components/table';
import Icon from '@erxes/ui/src/components/Icon';
import dayjs from 'dayjs';
import { __ } from 'coreui/utils';
import { DateContainer } from '@erxes/ui/src/styles/main';
import { IButtonMutateProps, IFormProps } from '@erxes/ui/src/types';
import React from 'react';
import Select from 'react-select-plus';
import SelectContractType, {
  ContractTypeById
} from '../../../contractTypes/containers/SelectContractType';
import { IContract, IContractDoc } from '../../types';
import SelectCustomers from '@erxes/ui-contacts/src/customers/containers/SelectCustomers';
import SelectCompanies from '@erxes/ui-contacts/src/companies/containers/SelectCompanies';
import SelectBranches from '@erxes/ui/src/team/containers/SelectBranches';
import { IContractType } from '../../../contractTypes/types';
import { IUser } from '@erxes/ui/src/auth/types';
import { generateCustomGraphic, getDiffDay } from '../../utils/customGraphic';
import { LoanContract, LoanSchedule } from '../../interface/LoanContract';
import { LoanPurpose, ORGANIZATION_TYPE } from '../../../constants';
import { LEASE_TYPES } from '../../../contractTypes/constants';
import SelectSavingContract, {
  Contracts
} from '../collaterals/SelectSavingContract';

type Props = {
  currentUser: IUser;
  renderButton: (
    props: IButtonMutateProps & { disabled: boolean }
  ) => JSX.Element;
  contract: IContract;
  closeModal: () => void;
  change?: boolean;
};

interface State extends LoanContract {
  config?: {
    maxAmount: number;
    minAmount: number;
    maxTenor: number;
    minTenor: number;
    maxInterest: number;
    minInterest: number;
    savingPlusLoanInterest: number;
    savingUpperPercent: number;
  };
  schedule: LoanSchedule[];
  contractNumber?: string;
  changeRowIndex?: number;
}

function isGreaterNumber(value: any, compareValue: any) {
  value = Number(value || 0);
  compareValue = Number(compareValue || 0);
  return value > compareValue;
}

interface ITabItem {
  component: any;
  label: string;
}

interface ITabs {
  tabs: ITabItem[];
}

export function Tabs({ tabs }: ITabs) {
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <>
      <MainTabs>
        {tabs.map((tab, index) => (
          <TabTitle
            className={tabIndex === index ? 'active' : ''}
            key={`tab${tab.label}`}
            onClick={() => setTabIndex(index)}
          >
            {tab.label}
          </TabTitle>
        ))}
      </MainTabs>

      <div style={{ width: '100%', marginTop: 20 }}>
        {tabs?.[tabIndex]?.component}
      </div>
    </>
  );
}

class ContractForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const { contract = {} } = props;

    this.state = {
      contractNumber: contract.number,
      contractDate: contract.contractDate || new Date(),
      endDate: contract.endDate,
      loanPurpose: contract.loanPurpose,
      loanDestination: contract.loanDestination,
      loanSubPurpose: contract.loanSubPurpose,
      contractTypeId: contract.contractTypeId || '',
      status: contract.status,
      branchId: contract.branchId,
      leaseType: contract.leaseType,
      description: contract.description || '',
      marginAmount: contract.marginAmount || 0,
      leaseAmount: contract.leaseAmount || 0,
      feeAmount: contract.feeAmount || 0,
      tenor: contract.tenor || 0,
      unduePercent: contract.unduePercent || 0,
      undueCalcType: contract.undueCalcType,
      interestRate: contract.interestRate || 0,
      interestMonth: (contract.interestRate || 0) / 12,
      repayment: contract.repayment || 'fixed',
      startDate: contract.startDate || new Date(),
      scheduleDays: contract.scheduleDays || [new Date().getDate()],
      debt: contract.debt || 0,
      debtTenor: contract.debtTenor || 0,
      debtLimit: contract.debtLimit || 0,
      salvageAmount: contract.salvageAmount || 0,
      salvagePercent: contract.salvagePercent || 0,
      salvageTenor: contract.salvageTenor || 0,
      skipInterestCalcMonth: contract.skipInterestCalcMonth || 0,
      useDebt: contract.useDebt,
      useMargin: contract.useMargin,
      useSkipInterest: contract.useSkipInterest,
      relationExpertId: contract.relationExpertId || '',
      leasingExpertId: contract.leasingExpertId || '',
      riskExpertId: contract.riskExpertId || '',
      customerId: contract.customerId || '',
      customerType: contract.customerType || 'customer',
      weekends: contract.weekends || [],
      useHoliday: contract.useHoliday || false,
      relContractId: contract.relContractId || '',
      skipAmountCalcMonth: contract.skipAmountCalcMonth || 0,
      customInterest: contract.customInterest || 0,
      customPayment: contract.customPayment || 0,
      currency:
        contract.currency || this.props.currentUser.configs?.dealCurrency[0],
      downPayment: contract.downPayment || 0,
      useFee: contract.useFee,
      useManualNumbering: contract.useManualNumbering,
      commitmentInterest: contract.commitmentInterest,
      savingContractId: contract.savingContractId,
      schedule:
        contract.repayment === 'custom'
          ? generateCustomGraphic({
              dateRange: contract.scheduleDays,
              interestRate: contract.interestRate,
              leaseAmount: contract.leaseAmount,
              startDate: contract.startDate,
              tenor: contract.tenor,
              isPayFirstMonth: contract.isPayFirstMonth,
              skipAmountCalcMonth: contract.skipAmountCalcMonth,
              customPayment: contract.customPayment,
              customInterest: contract.customInterest
            })
          : []
    };
  }

  generateDoc = (values: { _id: string } & IContractDoc) => {
    const { contract } = this.props;

    const finalValues = values;

    if (contract) {
      finalValues._id = contract._id;
    }

    const result: State & {
      createdBy: string;
      createdAt: Date;
      number?: string;
      _id: string;
    } = {
      _id: finalValues._id,
      number: this.state.contractNumber,
      ...this.state,
      contractTypeId: this.state.contractTypeId,
      branchId: this.state.branchId,
      status: this.state.status,
      description: this.state.description,
      createdBy: finalValues.createdBy,
      createdAt: finalValues.createdAt,
      marginAmount: Number(this.state.marginAmount),
      leaseAmount: Number(this.state.leaseAmount),
      feeAmount: Number(this.state.feeAmount),
      tenor: Number(this.state.tenor),
      unduePercent: Number(this.state.unduePercent),
      interestRate: Number(this.state.interestRate),
      skipInterestCalcMonth: Number(this.state.skipInterestCalcMonth),
      skipAmountCalcMonth: Number(this.state.skipAmountCalcMonth),
      customPayment: Number(this.state.customPayment),
      customInterest: Number(this.state.customInterest),
      repayment: this.state.repayment,
      undueCalcType: this.state.undueCalcType || 'fromInterest',
      startDate: this.state.startDate,
      scheduleDays: this.state.scheduleDays,
      debt: Number(this.state.debt),
      debtTenor: Number(this.state.debtTenor),
      debtLimit: Number(this.state.debtLimit),
      customerId: this.state.customerId || '',
      customerType: this.state.customerType || '',
      salvageAmount: 0,
      salvagePercent: 0,
      salvageTenor: 0,
      useDebt: this.state.useDebt,
      useMargin: this.state.useMargin,
      useSkipInterest: this.state.useSkipInterest,
      relationExpertId: this.state.relationExpertId,
      leasingExpertId: this.state.leasingExpertId,
      riskExpertId: this.state.riskExpertId,
      leaseType: this.state.leaseType,
      savingContractId: this.state.savingContractId,
      commitmentInterest: this.state.commitmentInterest,
      weekends: this.state.weekends.map(week => Number(week)),
      useHoliday: Boolean(this.state.useHoliday),
      relContractId: this.state.relContractId,
      currency: this.state.currency,
      downPayment: Number(this.state.downPayment || 0),
      schedule: this.state.schedule,
      useManualNumbering: this.state.useManualNumbering,
      useFee: this.state.useFee,
      loanPurpose: this.state.loanPurpose,
      endDate: this.state.endDate,
      loanDestination: this.state.loanDestination
    };

    if (this.state.leaseType === 'salvage') {
      result.salvageAmount = Number(this.state.salvageAmount);
      result.salvagePercent = Number(this.state.salvagePercent);
      result.salvageTenor = Number(this.state.salvageTenor);
    }

    return result;
  };

  renderFormGroup = (label, props) => {
    if (!label) return <FormControl {...props} />;
    return (
      <FormGroup>
        <ControlLabel required={props.required}>{__(label)}</ControlLabel>
        <FormControl {...props} />
      </FormGroup>
    );
  };

  onChangeField = e => {
    const name = (e?.target as HTMLInputElement)?.name;
    let value: any = (e?.target as HTMLInputElement)?.value;

    if ((e?.target as HTMLInputElement)?.type === 'checkbox')
      value = (e.target as HTMLInputElement).checked;

    const repayment = name === 'repayment' ? value : this.state.repayment;

    if (
      (name === 'repayment' && repayment === 'custom') ||
      (repayment === 'custom' &&
        (name === 'tenor' ||
          name === 'leaseAmount' ||
          name === 'customPayment' ||
          name === 'customInterest' ||
          name === 'scheduleDays' ||
          name === 'isPayFirstMonth' ||
          name === 'interestRate' ||
          name === 'startDate')) ||
      name === 'skipAmountCalcMonth'
    ) {
      const tenor = Number(name === 'tenor' ? value : this.state.tenor);
      const leaseAmount = Number(
        name === 'leaseAmount' ? value : this.state.leaseAmount
      );
      const customPayment = Number(
        name === 'customPayment' ? value : this.state.customPayment || 0
      );
      const customInterest = Number(
        name === 'customInterest' ? value : this.state.customInterest || 0
      );
      const isPayFirstMonth =
        name === 'isPayFirstMonth' ? value : this.state.isPayFirstMonth;
      const interestRate =
        name === 'interestRate' ? value : this.state.interestRate;
      const startDate = name === 'startDate' ? value : this.state.startDate;
      const scheduleDays =
        name === 'scheduleDays' ? value : this.state.scheduleDays;
      const skipAmountCalcMonth =
        name === 'skipAmountCalcMonth' ? value : this.state.skipAmountCalcMonth;

      let schedules: LoanSchedule[] = generateCustomGraphic({
        dateRange: scheduleDays,
        interestRate,
        leaseAmount,
        startDate,
        tenor,
        customInterest,
        customPayment,
        isPayFirstMonth,
        skipAmountCalcMonth
      });
      this.setState({ schedule: schedules });
    }
    if (name === 'interestRate') {
      this.setState({
        interestRate: Number(value),
        interestMonth: Number(value || 0) / 12
      });
      return;
    }

    this.setState({ [name]: value } as any);
  };

  onSelectTeamMember = (value, name) => {
    this.setState({ [name]: value } as any);
  };

  onSelectContractType = value => {
    const contractTypeObj: IContractType = ContractTypeById[value];

    var changingStateValue: any = {
      contractTypeId: value,
      leaseType: (contractTypeObj && contractTypeObj.leaseType) || 'finance',
      commitmentInterest:
        (contractTypeObj && contractTypeObj.commitmentInterest) || 0,
      useMargin: contractTypeObj.useMargin,
      useSkipInterest: contractTypeObj.useSkipInterest,
      useDebt: contractTypeObj.useDebt,
      currency: contractTypeObj.currency,
      config: {
        ...contractTypeObj?.config,
        savingUpperPercent: contractTypeObj.savingUpperPercent,
        savingPlusLoanInterest: contractTypeObj.savingPlusLoanInterest
      },
      useManualNumbering: contractTypeObj?.useManualNumbering,
      useFee: contractTypeObj?.useFee
    };

    if (
      contractTypeObj.invoiceDay &&
      contractTypeObj.leaseType === LEASE_TYPES.CREDIT
    ) {
      changingStateValue['scheduleDays'] = [contractTypeObj.invoiceDay];
    }

    if (!this.state.unduePercent) {
      changingStateValue['unduePercent'] = contractTypeObj?.unduePercent;
    }
    if (!this.state.undueCalcType) {
      changingStateValue['undueCalcType'] = contractTypeObj?.undueCalcType;
    }
    if (!this.state.interestMonth && contractTypeObj?.config?.defaultInterest) {
      changingStateValue['interestMonth'] = Number(
        contractTypeObj?.config?.defaultInterest
      );
      changingStateValue['interestRate'] = Number(
        contractTypeObj?.config?.defaultInterest || 0
      );
    }

    if (!this.state.tenor && contractTypeObj?.config?.minTenor) {
      changingStateValue['tenor'] = contractTypeObj?.config?.minTenor;
    }

    if (!this.state.leaseAmount && contractTypeObj?.config?.minAmount) {
      changingStateValue['leaseAmount'] = contractTypeObj?.config?.minAmount;
    }

    this.setState({ ...changingStateValue });
  };

  onSelectCustomer = value => {
    this.setState({
      customerId: value
    });
  };

  onCheckCustomerType = e => {
    this.setState({
      customerType: e.target.checked ? 'company' : 'customer'
    });
  };

  onFieldClick = e => {
    e.target.select();
  };

  checkValidation = (): any => {
    const errors: any = {};

    function errorWrapper(text: string) {
      return <label style={{ color: 'red' }}>{text}</label>;
    }

    if (
      this.state.useMargin &&
      this.state.leaseAmount &&
      Number(this.state.marginAmount) < Number(this.state.leaseAmount)
    )
      errors.marginAmount = errorWrapper(
        'Margin Amount can not be less than lease Amount'
      );

    if (
      this.state.config &&
      this.state.config.minAmount &&
      isGreaterNumber(this.state.config.minAmount, this.state.leaseAmount)
    )
      errors.leaseAmount = errorWrapper(
        `${__('Lease amount must greater than')} ${this.state.config.minAmount}`
      );

    if (
      this.state.config &&
      this.state.config.maxAmount &&
      isGreaterNumber(this.state.leaseAmount, this.state.config.maxAmount)
    )
      errors.leaseAmount = errorWrapper(
        `${__('Lease amount must less than')} ${this.state.config.maxAmount}`
      );

    if (
      this.state.config &&
      this.state.config.minTenor &&
      isGreaterNumber(this.state.config.minTenor, this.state.tenor)
    )
      errors.tenor = errorWrapper(
        `${__('Tenor must greater than')} ${this.state.config.minTenor}`
      );

    if (
      this.state.config &&
      this.state.config.maxTenor &&
      isGreaterNumber(this.state.tenor, this.state.config.maxTenor)
    )
      errors.tenor = errorWrapper(
        `${__('Tenor must less than')} ${this.state.config.maxTenor}`
      );

    if (
      this.state.config &&
      this.state.config.minInterest &&
      isGreaterNumber(this.state.config.minInterest, this.state.interestRate)
    )
      errors.interestRate = errorWrapper(
        `${__(
          'Interest must greater than'
        )} ${this.state.config.minInterest.toFixed(0)}`
      );

    if (
      this.state.config &&
      this.state.config.maxInterest &&
      isGreaterNumber(this.state.interestRate, this.state.config.maxInterest)
    )
      errors.interestRate = errorWrapper(
        `${__(
          'Interest must less than'
        )} ${this.state.config.maxInterest.toFixed(0)}`
      );

    return errors;
  };

  renderContent = (formProps: IFormProps) => {
    const { closeModal, renderButton } = this.props;
    const { values, isSubmitted } = formProps;

    const onChangeBranchId = value => {
      this.setState({ branchId: value });
    };

    const onChangeContractDate = value => {
      this.setState({ contractDate: value });
    };

    return (
      <>
        <ScrollWrapper>
          <FormWrapper>
            <FormColumn>
              <div style={{ paddingBottom: '13px', paddingTop: '20px' }}>
                {this.renderFormGroup('Is Organization', {
                  ...formProps,
                  className: 'flex-item',
                  type: 'checkbox',
                  componentClass: 'checkbox',
                  name: 'customerType',
                  checked: this.state.customerType === 'company',
                  onChange: this.onCheckCustomerType
                })}
              </div>
              {this.state.customerType === 'customer' && (
                <FormGroup>
                  <ControlLabel required={true}>{__('Customer')}</ControlLabel>
                  <SelectCustomers
                    label="Choose customer"
                    name="customerId"
                    initialValue={this.state.customerId}
                    onSelect={this.onSelectCustomer}
                    multi={false}
                  />
                </FormGroup>
              )}
              {this.state.customerType === 'company' && (
                <FormGroup>
                  <ControlLabel required={true}>{__('Company')}</ControlLabel>
                  <SelectCompanies
                    label="Choose company"
                    name="customerId"
                    initialValue={this.state.customerId}
                    onSelect={this.onSelectCustomer}
                    multi={false}
                  />
                </FormGroup>
              )}
              {this.state.useManualNumbering &&
                this.renderFormGroup('Contract Number', {
                  ...formProps,
                  name: 'contractNumber',
                  value: this.state.contractNumber,
                  onChange: this.onChangeField,
                  onClick: this.onFieldClick
                })}

              {this.state.useFee &&
                this.renderFormGroup('Fee Amount', {
                  ...formProps,
                  type: 'number',
                  name: 'feeAmount',
                  useNumberFormat: true,
                  fixed: 2,
                  value: this.state.feeAmount || 0,
                  onChange: this.onChangeField,
                  onClick: this.onFieldClick
                })}

              {this.state.useMargin &&
                this.renderFormGroup('Margin Amount', {
                  ...formProps,
                  type: 'number',
                  name: 'marginAmount',
                  useNumberFormat: true,
                  fixed: 2,
                  value: this.state.marginAmount || 0,
                  required: true,
                  errors: this.checkValidation(),
                  onChange: this.onChangeField,
                  onClick: this.onFieldClick
                })}
              {this.props.currentUser?.configs?.loansConfig
                ?.organizationType === ORGANIZATION_TYPE.BBSB && (
                <FormGroup>
                  <ControlLabel required={true}>{__('Loan Type')}</ControlLabel>
                  <FormControl
                    {...formProps}
                    name="loanDestination"
                    componentClass="select"
                    value={this.state.loanDestination}
                    onChange={this.onChangeField}
                  >
                    {LoanPurpose.destination.map((type, index) => (
                      <option key={index} value={type.code}>
                        {__(type.name)}
                      </option>
                    ))}
                  </FormControl>
                </FormGroup>
              )}
            </FormColumn>
            <FormColumn>
              <FormGroup>
                <ControlLabel required={true}>
                  {__('Contract Date')}
                </ControlLabel>
                <DateContainer>
                  <DateControl
                    {...formProps}
                    required={false}
                    dateFormat="YYYY/MM/DD"
                    name="contractDate"
                    value={this.state.contractDate}
                    onChange={onChangeContractDate}
                  />
                </DateContainer>
              </FormGroup>
              <FormGroup>
                <ControlLabel required={true}>
                  {__('Contract Type')}
                </ControlLabel>
                <SelectContractType
                  label={__('Choose type')}
                  name="contractTypeId"
                  value={this.state.contractTypeId || ''}
                  onSelect={this.onSelectContractType}
                  multi={false}
                ></SelectContractType>
              </FormGroup>
              {this.props.currentUser?.configs?.loansConfig
                ?.organizationType === ORGANIZATION_TYPE.BBSB && (
                <FormGroup>
                  <ControlLabel required={true}>
                    {__('Loan Purpose')}
                  </ControlLabel>
                  <FormControl
                    {...formProps}
                    name="loanPurpose"
                    componentClass="select"
                    value={this.state.loanPurpose}
                    onChange={this.onChangeField}
                  >
                    {LoanPurpose.purpose
                      .filter(a =>
                        this.state.loanDestination
                          ? a.parent === this.state.loanDestination
                          : true
                      )
                      .map((type, index) => (
                        <option key={index} value={type.name}>
                          {__(type.name)}
                        </option>
                      ))}
                  </FormControl>
                </FormGroup>
              )}
              {this.state.useMargin &&
                this.renderFormGroup('Down payment', {
                  ...formProps,
                  type: 'number',
                  name: 'downPayment',
                  useNumberFormat: true,
                  fixed: 2,
                  value: this.state.downPayment || 0,
                  onChange: this.onChangeField,
                  onClick: this.onFieldClick
                })}
            </FormColumn>
            <FormColumn>
              <FormGroup>
                <ControlLabel>{__('Branches')}</ControlLabel>
                <SelectBranches
                  name="branchId"
                  label={__('Choose branch')}
                  initialValue={this.state?.branchId}
                  onSelect={onChangeBranchId}
                  multi={false}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>{__('Leasing Expert')}</ControlLabel>
                <SelectTeamMembers
                  label={__('Choose an leasing expert')}
                  name="leasingExpertId"
                  initialValue={this.state.leasingExpertId}
                  onSelect={this.onSelectTeamMember}
                  multi={false}
                />
              </FormGroup>
              {this.state.useMargin && (
                <div style={{ paddingBottom: '13px', paddingTop: '20px' }}>
                  {this.renderFormGroup('Is Barter', {
                    ...formProps,
                    className: 'flex-item',
                    type: 'checkbox',
                    componentClass: 'checkbox',
                    name: 'isBarter',
                    checked: this.state.isBarter || false,
                    onChange: this.onChangeField
                  })}
                </div>
              )}
              {this.state.leaseType === LEASE_TYPES.SAVING && (
                <FormGroup>
                  <ControlLabel required={true}>
                    {__('Saving Contract')}
                  </ControlLabel>
                  <SelectSavingContract
                    label={__('Choose an contract')}
                    name="depositAccount"
                    initialValue={this.state.savingContractId}
                    filterParams={{
                      isDeposit: false,
                      customerId: this.state.customerId
                    }}
                    onSelect={v => {
                      if (typeof v === 'string') {
                        const savingContract = Contracts[v];

                        let changeState: any = {
                          savingContractId: v,
                          endDate: savingContract.endDate
                        };
                        if (
                          this.state.config?.savingUpperPercent &&
                          this.state.config?.savingPlusLoanInterest
                        ) {
                          changeState.leaseAmount =
                            (savingContract.savingAmount *
                              this.state.config?.savingUpperPercent) /
                            100;
                          changeState.interestRate =
                            savingContract.interestRate +
                            this.state.config?.savingPlusLoanInterest;
                          changeState.tenor = dayjs(
                            savingContract.endDate
                          ).diff(
                            dayjs(this.state.startDate ?? new Date()),
                            'month'
                          );
                        }
                        this.setState({ ...changeState });
                      }
                    }}
                    multi={false}
                  />
                </FormGroup>
              )}
            </FormColumn>
          </FormWrapper>
          <FormWrapper>
            <FormColumn>
              <FormGroup>
                <ControlLabel>{__('Description')}</ControlLabel>
                <FormControl
                  {...formProps}
                  max={140}
                  name="description"
                  componentClass="textarea"
                  value={this.state.description || ''}
                  onChange={this.onChangeField}
                />
              </FormGroup>
            </FormColumn>
          </FormWrapper>
        </ScrollWrapper>

        <ModalFooter>
          <Button btnStyle="simple" onClick={closeModal} icon="cancel-1">
            {__('Close')}
          </Button>

          {renderButton({
            name: 'contract',
            values: this.generateDoc(values),
            disabled: !!Object.keys(this.checkValidation()).length,
            isSubmitted,
            object: this.props.contract
          })}
        </ModalFooter>
      </>
    );
  };

  renderGraphic = (formProps: IFormProps) => {
    const { closeModal, renderButton } = this.props;
    const { values, isSubmitted } = formProps;

    const onChangeStartDate = value => {
      this.setState({ startDate: value });
    };

    const onSelectScheduleDays = values => {
      this.onChangeField({
        target: { name: 'scheduleDays', value: values.map(val => val.value) }
      });
    };

    const onChangeRow = (value, key, index) => {
      const { schedule } = this.state;
      switch (key) {
        case 'payDate':
          const nDate = new Date(
            schedule[index - 1]?.payDate ?? this.state.startDate
          );
          schedule[index].payDate = new Date(value);
          schedule[index].diffDay = Number(getDiffDay(nDate, value).toFixed(0));
          if (schedule[index + 1]?.payDate)
            schedule[index + 1].diffDay = Number(
              getDiffDay(
                schedule[index].payDate,
                schedule[index + 1].payDate
              ).toFixed(0)
            );
          break;
        case 'payment':
          schedule[index].payment = Number(value);
          break;
        case 'interestNonce':
          schedule[index].interestNonce = Number(value);
          break;

        default:
          break;
      }
      this.setState({ schedule: [...schedule] });
    };

    return (
      <>
        <ScrollWrapper>
          <FormWrapper>
            <FormColumn>
              <FormGroup>
                <ControlLabel required={true}>{__('Start Date')}</ControlLabel>
                <DateContainer>
                  <DateControl
                    {...formProps}
                    required={false}
                    name="startDate"
                    dateFormat="YYYY/MM/DD"
                    value={this.state.startDate}
                    onChange={onChangeStartDate}
                  />
                </DateContainer>
              </FormGroup>
              {this.renderFormGroup('Lease Amount', {
                type: 'number',
                name: 'leaseAmount',
                useNumberFormat: true,
                required: true,
                fixed: 2,
                value: this.state.leaseAmount || 0,
                errors: this.checkValidation(),
                onChange: this.onChangeField
              })}
              {this.state.repayment === 'custom' &&
                this.renderFormGroup('Skip Amount Calc /Month/', {
                  type: 'number',
                  name: 'skipAmountCalcMonth',
                  value: this.state.skipAmountCalcMonth,
                  onChange: this.onChangeField
                })}
            </FormColumn>
            <FormColumn>
              {this.state.leaseType === LEASE_TYPES.FINANCE && (
                <FormGroup>
                  <ControlLabel required={true}>{__('Repayment')}</ControlLabel>
                  <FormControl
                    {...formProps}
                    name="repayment"
                    componentClass="select"
                    value={this.state.repayment}
                    onChange={this.onChangeField}
                  >
                    {['fixed', 'equal', 'custom'].map((typeName, index) => (
                      <option key={index} value={typeName}>
                        {__(typeName + 'Method')}
                      </option>
                    ))}
                  </FormControl>
                </FormGroup>
              )}
              {this.renderFormGroup('Tenor', {
                type: 'number',
                name: 'tenor',
                useNumberFormat: true,
                value: this.state.tenor || 0,
                errors: this.checkValidation(),
                required: true,
                max: this.state.config?.maxTenor,
                onChange: this.onChangeField
              })}

              {this.state.repayment === 'custom' &&
                this.renderFormGroup('Custom payment Amount', {
                  type: 'number',
                  name: 'customPayment',
                  useNumberFormat: true,
                  fixed: 2,
                  value: this.state.customPayment || 0,
                  onChange: this.onChangeField
                })}
              {this.state.useSkipInterest &&
                this.renderFormGroup('Skip Interest Calc /Month/', {
                  type: 'number',
                  name: 'skipInterestCalcMonth',
                  value: this.state.skipInterestCalcMonth,
                  onChange: this.onChangeField
                })}
              {this.state.leaseType === LEASE_TYPES.LINEAR &&
                this.renderFormGroup('Commitment interest', {
                  ...formProps,
                  type: 'number',
                  useNumberFormat: true,
                  fixed: 2,
                  name: 'commitmentInterest',
                  value: this.state.commitmentInterest || 0,
                  errors: this.checkValidation(),
                  onChange: this.onChangeField,
                  onClick: this.onFieldClick
                })}
            </FormColumn>
            <FormColumn>
              {this.state.leaseType === LEASE_TYPES.FINANCE && (
                <FormGroup>
                  <ControlLabel required>{__('Schedule Days')}</ControlLabel>
                  <Select
                    required
                    className="flex-item"
                    placeholder={__('Choose an schedule Days')}
                    value={this.state.scheduleDays}
                    onChange={onSelectScheduleDays}
                    multi={true}
                    options={new Array(31).fill(1).map((row, index) => ({
                      value: row + index,
                      label: row + index
                    }))}
                  />
                </FormGroup>
              )}
              {this.state.leaseType === LEASE_TYPES.SAVING && (
                <FormGroup>
                  <ControlLabel required={true}>{__('End Date')}</ControlLabel>
                  <DateContainer>
                    <DateControl
                      {...formProps}
                      required={false}
                      dateFormat="YYYY/MM/DD"
                      name="endDate"
                      value={this.state.endDate}
                    />
                  </DateContainer>
                </FormGroup>
              )}
              {this.renderFormGroup('Interest Rate', {
                ...formProps,
                type: 'number',
                useNumberFormat: true,
                fixed: 2,
                name: 'interestRate',
                value: this.state.interestRate || 0,
                errors: this.checkValidation(),
                onChange: this.onChangeField,
                onClick: this.onFieldClick
              })}
              {this.state.repayment === 'custom' &&
                this.renderFormGroup('Custom Interest', {
                  ...formProps,
                  type: 'number',
                  useNumberFormat: true,
                  fixed: 2,
                  name: 'customInterest',
                  value: this.state.customInterest || 0,
                  onChange: this.onChangeField,
                  onClick: this.onFieldClick
                })}
              {this.state.leaseType === LEASE_TYPES.FINANCE &&
                this.renderFormGroup('Is Pay First Month', {
                  className: 'flex-item',
                  type: 'checkbox',
                  componentClass: 'checkbox',
                  name: 'isPayFirstMonth',
                  checked: this.state.isPayFirstMonth || false,
                  onChange: this.onChangeField
                })}
            </FormColumn>
          </FormWrapper>
          {this.state.repayment === 'custom' && (
            <Table striped>
              <thead>
                <tr>
                  <th></th>
                  <th style={{ textAlign: 'center' }}>{__('Day')}</th>
                  <th style={{ textAlign: 'center' }}>{__('Schedule day')}</th>
                  <th style={{ textAlign: 'center' }}>{__('Payment')}</th>
                  <th style={{ textAlign: 'center' }}>{__('Interest')}</th>
                  <th style={{ textAlign: 'center' }}>{__('Total')}</th>
                </tr>
              </thead>
              <tbody>
                {this.state.schedule.map((mur, rowIndex) => {
                  if (rowIndex === this.state.changeRowIndex)
                    return (
                      <tr key={`schedule${mur.order}`}>
                        <td style={{ textAlign: 'center' }}>{mur.order}</td>
                        <td style={{ textAlign: 'center' }}>{mur.diffDay}</td>
                        <td style={{ textAlign: 'center' }}>
                          <DateContainer>
                            <DateControl
                              required={false}
                              name="payDate"
                              dateFormat="YYYY/MM/DD"
                              value={mur.payDate}
                              onChange={v =>
                                onChangeRow(v, 'payDate', rowIndex)
                              }
                            />
                          </DateContainer>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {this.renderFormGroup(undefined, {
                            type: 'number',
                            useNumberFormat: true,
                            fixed: 2,
                            name: 'payment',
                            value: mur.payment || 0,
                            onChange: e => {
                              onChangeRow(e.target.value, 'payment', rowIndex);
                            }
                          })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {this.renderFormGroup(undefined, {
                            type: 'number',
                            useNumberFormat: true,
                            fixed: 2,
                            name: 'interestNonce',
                            value: mur.interestNonce || 0,
                            onChange: e => {
                              onChangeRow(
                                e.target.value,
                                'interestNonce',
                                rowIndex
                              );
                            }
                          })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span>{mur.total?.toLocaleString()}</span>
                          <span
                            style={{ marginLeft: 10 }}
                            onClick={() =>
                              this.setState({ changeRowIndex: undefined })
                            }
                          >
                            <Icon icon="check" />
                          </span>
                        </td>
                      </tr>
                    );
                  return (
                    <tr key={`schedule${mur.order}`}>
                      <td style={{ textAlign: 'center' }}>{mur.order}</td>
                      <td style={{ textAlign: 'center' }}>{mur.diffDay}</td>
                      <td style={{ textAlign: 'center' }}>
                        {mur.payDate.toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {mur.payment?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {mur.interestNonce?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span>{mur.total?.toLocaleString()}</span>
                        <span
                          style={{ marginLeft: 10 }}
                          onClick={() =>
                            this.setState({ changeRowIndex: rowIndex })
                          }
                        >
                          <Icon icon="edit" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td></td>
                  <td></td>
                  <td style={{ textAlign: 'center' }}>
                    {this.state.schedule.length}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {this.state.schedule
                      .reduce((a, b) => a + Number(b.payment), 0)
                      .toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {this.state.schedule
                      .reduce((a, b) => a + Number(b.interestNonce || 0), 0)
                      .toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {this.state.schedule
                      .reduce((a, b) => a + Number(b.total), 0)
                      .toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </ScrollWrapper>
        <ModalFooter>
          <Button btnStyle="simple" onClick={closeModal} icon="cancel-1">
            {__('Close')}
          </Button>

          {renderButton({
            name: 'contract',
            values: this.generateDoc(values),
            disabled: !!Object.keys(this.checkValidation()).length,
            isSubmitted,
            object: this.props.contract
          })}
        </ModalFooter>
      </>
    );
  };

  render() {
    const { change } = this.props;
    if (change) return <Form renderContent={this.renderGraphic} />;
    return (
      <Tabs
        tabs={[
          {
            label: 'Гэрээ',
            component: <Form renderContent={this.renderContent} />
          },
          {
            label: 'Хуваарь',
            component: <Form renderContent={this.renderGraphic} />
          }
        ]}
      />
    );
  }
}

export default ContractForm;
