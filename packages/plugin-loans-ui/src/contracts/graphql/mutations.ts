import { contractDetailFields } from './queries';

const commonFields = `
  $contractTypeId: String,
  $number: String,
  $branchId: String,
  $status: String,
  $description: String,
  $createdBy: String,
  $createdAt: Date,
  $marginAmount: Float,
  $leaseAmount: Float,
  $feeAmount: Float,
  $tenor: Float,
  $unduePercent: Float,
  $undueCalcType: String,
  $interestRate: Float,
  $skipInterestCalcMonth: Float,
  $repayment: String,
  $startDate: Date,
  $scheduleDays: [Float],
  $customerId: String,
  $customerType: String,

  $collateralsData: JSON,
  $schedule: JSON,
  $insurancesData: JSON,

  $debt: Float
  $debtTenor: Float
  $debtLimit: Float

  $salvageAmount: Float
  $salvagePercent: Float
  $salvageTenor: Float

  $relationExpertId: String
  $leasingExpertId: String
  $riskExpertId: String
  $weekends: [Int]
  $useHoliday: Boolean
  $useMargin: Boolean
  $useSkipInterest: Boolean
  $useDebt: Boolean
  $dealId: String

  $relContractId: String
  $currency:String
  $isPayFirstMonth: Boolean
  $downPayment: Float
  $skipAmountCalcMonth: Float
  $customPayment: Float
  $customInterest: Float
  
  $isBarter: Boolean
  $useManualNumbering:Boolean
  $useFee:Boolean
  $loanPurpose: String
  $leaseType: String
  $commitmentInterest: Float
  $endDate: Date
  $savingContractId: String
`;

const commonVariables = `
  contractTypeId: $contractTypeId,
  number: $number,
  branchId: $branchId,
  status: $status,
  description: $description,
  createdBy: $createdBy,
  createdAt: $createdAt,
  marginAmount: $marginAmount,
  leaseAmount: $leaseAmount,
  feeAmount: $feeAmount,
  tenor: $tenor,
  unduePercent: $unduePercent,
  undueCalcType: $undueCalcType,
  skipInterestCalcMonth: $skipInterestCalcMonth,
  interestRate: $interestRate,
  repayment: $repayment,
  startDate: $startDate,
  scheduleDays: $scheduleDays,
  customerId: $customerId,
  customerType: $customerType,

  collateralsData: $collateralsData,
  schedule: $schedule,
  insurancesData: $insurancesData,

  salvageAmount: $salvageAmount
  salvagePercent: $salvagePercent
  salvageTenor: $salvageTenor

  debt: $debt
  debtTenor: $debtTenor
  debtLimit: $debtLimit

  relationExpertId: $relationExpertId
  leasingExpertId: $leasingExpertId
  riskExpertId: $riskExpertId
  weekends: $weekends
  useHoliday: $useHoliday
  useMargin: $useMargin
  useSkipInterest: $useSkipInterest
  useDebt: $useDebt
  dealId: $dealId

  relContractId: $relContractId
  currency: $currency
  isPayFirstMonth: $isPayFirstMonth
  downPayment: $downPayment
  skipAmountCalcMonth: $skipAmountCalcMonth
  customPayment: $customPayment
  customInterest: $customInterest
  isBarter: $isBarter
  useManualNumbering: $useManualNumbering
  useFee: $useFee
  loanPurpose: $loanPurpose
  leaseType:$leaseType
  commitmentInterest:$commitmentInterest
  endDate:$endDate
  savingContractId: $savingContractId
`;

const contractsAdd = `
  mutation contractsAdd(${commonFields}) {
    contractsAdd(${commonVariables}) {
      _id
      number
      contractTypeId
      ${contractDetailFields}
    }
  }
`;

const contractsEdit = `
  mutation contractsEdit($_id: String!, ${commonFields}) {
    contractsEdit(_id: $_id, ${commonVariables}) {
      _id
      ${contractDetailFields}
    }
  }
`;

const contractsDealEdit = `
  mutation contractsDealEdit($_id: String!, ${commonFields}) {
    contractsEdit(_id: $_id, ${commonVariables}) {
      _id
      ${contractDetailFields}
    }
  }
`;

const contractsRemove = `
  mutation contractsRemove($contractIds: [String]) {
    contractsRemove(contractIds: $contractIds)
  }
`;

const getProductsData = `
  mutation getProductsData($contractId: String) {
    getProductsData(contractId: $contractId) {
      collateralsData
    }
  }
`;

const contractsClose = `
  mutation contractsClose($contractId: String, $closeDate: Date, $closeType: String, $description: String) {
    contractsClose(contractId: $contractId, closeDate: $closeDate, closeType: $closeType, description: $description) {
      _id
      ${contractDetailFields}
    }
  }
`;

const regenSchedules = `
  mutation regenSchedules($contractId: String!) {
    regenSchedules(contractId: $contractId)
  }
`;

const fixSchedules = `
  mutation fixSchedules($contractId: String!) {
    fixSchedules(contractId: $contractId)
  }
`;

const changeClassification = `
  mutation ClassificationsAdd($classifications: JSON) {
    classificationsAdd(classifications: $classifications) {
      _id
      description
      invDate
      classification
      total
      newClassification
      dtl {
        amount
        contractId
        currency
      }
    }
  }
`;

const stopInterest = `
mutation StopInterest($contractId: String, $stoppedDate: Date, $interestAmount: Float, $isStopLoss: Boolean, $lossAmount: Float) {
  stopInterest(contractId: $contractId, stoppedDate: $stoppedDate, interestAmount: $interestAmount, isStopLoss: $isStopLoss, lossAmount: $lossAmount) {
    _id
  }
}
`;
const interestChange = `
  mutation InterestChange($contractId: String, $stoppedDate: Date, $isStopLoss: Boolean, $interestAmount: Float, $lossAmount: Float) {
    interestChange(contractId: $contractId, stoppedDate: $stoppedDate, isStopLoss: $isStopLoss, interestAmount: $interestAmount, lossAmount: $lossAmount) {
      _id
    }
  }
`;

const interestReturn = `
  mutation InterestReturn($contractId: String, $stoppedDate: Date, $isStopLoss: Boolean, $interestAmount: Float, $lossAmount: Float) {
    interestReturn(contractId: $contractId, stoppedDate: $stoppedDate, isStopLoss: $isStopLoss, interestAmount: $interestAmount, lossAmount: $lossAmount) {
      _id
    }
  }
`;

export default {
  contractsAdd,
  contractsEdit,
  contractsDealEdit,
  contractsRemove,
  regenSchedules,
  fixSchedules,
  contractsClose,
  getProductsData,
  changeClassification,
  stopInterest,
  interestChange,
  interestReturn
};
