import {
  Button,
  EthHashInfo,
  Icon,
  IconText,
  RadioButtons,
  Text,
  TextField,
  Title,
} from '@gnosis.pm/safe-react-components'
import { FormControlLabel, hexToRgb, Switch as SwitchMui } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Skeleton } from '@material-ui/lab'
import { Mutator } from 'final-form'
import React from 'react'
import { useField, useForm, useFormState } from 'react-final-form'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import GnoField from 'src/components/forms/Field'
import GnoForm from 'src/components/forms/GnoForm'
import { composeValidators, minValue, mustBeFloat, required } from 'src/components/forms/validator'
import Block from 'src/components/layout/Block'
import GnoButton from 'src/components/layout/Button'
import Col from 'src/components/layout/Col'
import Img from 'src/components/layout/Img'
import Row from 'src/components/layout/Row'
import GnoModal from 'src/components/Modal'
import { ScanQRWrapper } from 'src/components/ScanQRModal/ScanQRWrapper'
import { getNetwork } from 'src/config'
import { getAddressBook } from 'src/logic/addressBook/store/selectors'
import { getNameFromAdbk } from 'src/logic/addressBook/utils'
import { Token } from 'src/logic/tokens/store/model/token'
import AddressBookInput from 'src/routes/safe/components/Balances/SendModal/screens/AddressBookInput'
import TokenSelectField from 'src/routes/safe/components/Balances/SendModal/screens/SendFunds/TokenSelectField'
import { setImageToPlaceholder } from 'src/routes/safe/components/Balances/utils'
import { extendedSafeTokensSelector, grantedSelector } from 'src/routes/safe/container/selector'

import AssetAmount from './assets/asset-amount.svg'
import Beneficiary from './assets/beneficiary.svg'
import Time from './assets/time.svg'

import { styles } from './style'

const useStyles = makeStyles(styles)

const InfoText = styled(Text)`
  margin-top: 16px;
`

const Steps = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  max-width: 720px;
  text-align: center;
`

const StepsLine = styled.div`
  height: 2px;
  flex: 1;
  background: #d4d5d3;
  margin: 46px 0;
`

const SpendingLimitStep = styled.div`
  width: 24%;
  min-width: 120px;
  max-width: 164px;
`
//
// TODO: refactor and split into components for better readability
//

const Field = styled(GnoField)`
  margin: 8px 0;
  width: 100%;
`

/**
 * beneficiary - START
 */
const KEYCODES = {
  TAB: 9,
  SHIFT: 16,
}
const BeneficiaryInput = styled.div`
  grid-area: beneficiaryInput;
`
const BeneficiaryScan = styled.div`
  grid-area: beneficiaryScan;
`
const SelectAddressRow = (): React.ReactElement => {
  const { initialValues } = useFormState()
  const { mutators } = useForm()
  React.useEffect(() => {
    if (initialValues?.beneficiary) {
      mutators?.setBeneficiary?.(initialValues.beneficiary)
    }
  }, [initialValues, mutators])

  const [selectedEntry, setSelectedEntry] = React.useState<{ address: string; name: string } | null>({
    address: initialValues?.beneficiary || '',
    name: '',
  })

  const [pristine, setPristine] = React.useState<boolean>(!initialValues?.beneficiary)
  React.useMemo(() => {
    if (selectedEntry === null) {
      mutators?.setBeneficiary?.('')

      if (pristine) {
        setPristine(false)
      }
    }
  }, [selectedEntry, mutators, pristine])

  const addressBook = useSelector(getAddressBook)
  const handleScan = (value, closeQrModal) => {
    let scannedAddress = value

    if (scannedAddress.startsWith('ethereum:')) {
      scannedAddress = scannedAddress.replace('ethereum:', '')
    }
    const scannedName = addressBook ? getNameFromAdbk(addressBook, scannedAddress) : ''
    mutators?.setBeneficiary?.(scannedAddress)
    setSelectedEntry({
      name: scannedName,
      address: scannedAddress,
    })
    closeQrModal()
  }

  return !!selectedEntry?.address ? (
    <BeneficiaryInput
      role="button"
      aria-pressed="false"
      tabIndex={0}
      onKeyDown={(e) => {
        if (![KEYCODES.TAB, KEYCODES.SHIFT].includes(e.keyCode)) {
          setSelectedEntry(null)
        }
      }}
      onClick={() => {
        setSelectedEntry(null)
      }}
    >
      <EthHashInfo
        hash={selectedEntry.address}
        name={selectedEntry.name}
        showCopyBtn
        showEtherscanBtn
        showIdenticon
        textSize="lg"
        network={getNetwork()}
      />
    </BeneficiaryInput>
  ) : (
    <>
      <BeneficiaryInput>
        <AddressBookInput
          fieldMutator={mutators?.setBeneficiary}
          pristine={pristine}
          setSelectedEntry={setSelectedEntry}
          label="Beneficiary"
        />
      </BeneficiaryInput>
      <BeneficiaryScan>
        <ScanQRWrapper handleScan={handleScan} />
      </BeneficiaryScan>
    </>
  )
}
/**
 * beneficiary - END
 */

/**
 * token
 */
const TokenInput = styled.div`
  grid-area: tokenInput;
`
const TokenSelectRow = (): React.ReactElement => {
  const tokens = useSelector(extendedSafeTokensSelector)

  return (
    <TokenInput>
      <TokenSelectField tokens={tokens} />
    </TokenInput>
  )
}

/**
 * amount
 */
const AmountInput = styled.div`
  grid-area: amountInput;
`
const GnoTextField = styled(TextField)`
  margin: 0;
`
const AmountSetRow = (): React.ReactElement => {
  const classes = useStyles()

  const {
    input: { value: tokenAddress },
  } = useField('token', { subscription: { value: true } })
  const {
    meta: { touched, visited },
  } = useField('amount', { subscription: { touched: true, visited: true } })
  const tokens = useSelector(extendedSafeTokensSelector)
  const selectedTokenRecord = tokens.find((token) => token.address === tokenAddress)
  const validate = (touched || visited) && composeValidators(required, mustBeFloat, minValue(0, false))

  return (
    <AmountInput>
      <Field
        component={GnoTextField}
        label="Amount*"
        name="amount"
        type="text"
        data-testid="amount-input"
        endAdornment={selectedTokenRecord?.symbol}
        className={classes.amountInput}
        validate={validate}
      />
    </AmountInput>
  )
}

/**
 * resetTime - START
 */
// TODO: propose refactor in safe-react-components based on this requirements
const SpendingLimitRadioButtons = styled(RadioButtons)`
  & .MuiRadio-colorPrimary.Mui-checked {
    color: ${({ theme }) => theme.colors.primary};
  }
`
const StyledSwitch = styled(({ ...rest }) => <SwitchMui {...rest} />)`
  && {
    .MuiIconButton-label,
    .MuiSwitch-colorSecondary {
      color: ${({ theme }) => theme.colors.icon};
    }

    .MuiSwitch-colorSecondary.Mui-checked .MuiIconButton-label {
      color: ${({ theme }) => theme.colors.primary};
    }

    .MuiSwitch-colorSecondary.Mui-checked:hover {
      background-color: ${({ theme }) => hexToRgb(`${theme.colors.primary}03`)};
    }

    .Mui-checked + .MuiSwitch-track {
      background-color: ${({ theme }) => theme.colors.primaryLight};
    }
  }
`
interface RadioButtonOption {
  label: string
  value: string
}
interface RadioButtonProps {
  options: RadioButtonOption[]
  initialValue: string
  groupName: string
}
const SafeRadioButtons = ({ options, initialValue, groupName }: RadioButtonProps): React.ReactElement => (
  <Field name={groupName} initialValue={initialValue}>
    {({ input: { name, value, onChange } }) => (
      <SpendingLimitRadioButtons name={name} value={value || initialValue} onRadioChange={onChange} options={options} />
    )}
  </Field>
)
const Switch = ({ label, name }: { label: string; name: string }): React.ReactElement => (
  <FormControlLabel
    label={label}
    control={
      <Field
        name={name}
        type="checkbox"
        render={({ input: { checked, onChange, name, value } }) => (
          <StyledSwitch checked={checked} onChange={onChange} name={name} value={value} />
        )}
      />
    }
  />
)
const RESET_TIME_OPTIONS = [
  { label: '1 day', value: '1' },
  { label: '1 week', value: '7' },
  { label: '1 month', value: '30' },
]
const ResetTimeLabel = styled.div`
  grid-area: resetTimeLabel;
`
const ResetTimeToggle = styled.div`
  grid-area: resetTimeToggle;
`
const ResetTimeOptions = styled.div`
  grid-area: resetTimeOption;
`
const ResetTime = (): React.ReactElement => {
  const {
    input: { value: withResetTime },
  } = useField('withResetTime', { subscription: { value: true } })

  return (
    <>
      <ResetTimeLabel>
        <Text size="xl">Set a reset-time to have the allowance automatically refill after a defined time-period.</Text>
      </ResetTimeLabel>
      <ResetTimeToggle>
        <Switch label="Reset time" name="withResetTime" />
      </ResetTimeToggle>
      {withResetTime && (
        <ResetTimeOptions>
          <SafeRadioButtons
            groupName="resetTime"
            initialValue={RESET_TIME_OPTIONS[0].value}
            options={RESET_TIME_OPTIONS}
          />
        </ResetTimeOptions>
      )}
    </>
  )
}
/**
 * resetTime - END
 */

const YetAnotherButton = styled(GnoButton)`
  &.Mui-disabled {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    opacity: 0.5;
  }
`
const canReview = ({ invalid, submitting, dirtyFieldsSinceLastSubmit, values }): boolean => {
  return !(
    submitting ||
    invalid ||
    !values.beneficiary ||
    (values.token && !values.amount) ||
    // TODO: review the next validation, as resetTime has a default value, this check looks unnecessary
    (values.withResetTime && !values.resetTime) ||
    !dirtyFieldsSinceLastSubmit
  )
}
interface NewSpendingLimitProps {
  initialValues?: Record<string, string>
  onCancel: () => void
  onReview: (values) => void
}
/**
 * New Spending Limit Form - START
 */
const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.separator};
`
const StyledButton = styled.button`
  background: none;
  border: none;
  padding: 5px;
  width: 26px;
  height: 26px;

  span {
    margin-right: 0;
  }

  :hover {
    background: ${({ theme }) => theme.colors.separator};
    border-radius: 16px;
    cursor: pointer;
  }
`
const FormContainer = styled.div`
  padding: 24px;
  align-items: center;
  display: grid;
  grid-template-columns: 4fr 1fr;
  grid-template-rows: 6fr;
  gap: 16px 8px;
  grid-template-areas:
    'beneficiaryInput beneficiaryScan'
    'tokenInput .'
    'amountInput .'
    'resetTimeLabel resetTimeLabel'
    'resetTimeToggle resetTimeToggle'
    'resetTimeOption resetTimeOption';
`
const FooterSection = styled.div`
  border-top: 2px solid ${({ theme }) => theme.colors.separator};
  padding: 16px 24px;
`
const FooterWrapper = styled.div`
  display: flex;
  justify-content: space-around;
`
const NewSpendingLimit = ({ initialValues, onCancel, onReview }: NewSpendingLimitProps): React.ReactElement => (
  <>
    <TitleSection>
      <Title size="xs" withoutMargin>
        New Spending Limit{' '}
        <Text size="lg" color="secondaryLight">
          1 of 2
        </Text>
      </Title>

      <StyledButton onClick={onCancel}>
        <Icon size="sm" type="cross" />
      </StyledButton>
    </TitleSection>

    <GnoForm formMutators={formMutators} onSubmit={onReview} initialValues={initialValues}>
      {(...args) => (
        <>
          <FormContainer>
            <SelectAddressRow />
            <TokenSelectRow />
            <AmountSetRow />
            <ResetTime />
          </FormContainer>

          <FooterSection>
            <FooterWrapper>
              <Button color="primary" size="md" onClick={onCancel}>
                Cancel
              </Button>

              <YetAnotherButton
                color="primary"
                size="medium"
                variant="contained"
                type="submit"
                disabled={!canReview(args[2])}
              >
                Review
              </YetAnotherButton>
            </FooterWrapper>
          </FooterSection>
        </>
      )}
    </GnoForm>
  </>
)

const StyledImage = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin: 0 8px 0 0;
`
const StyledImageName = styled.div`
  display: flex;
  align-items: center;
`
interface ReviewSpendingLimitProps {
  onBack: () => void
  onClose: () => void
  onSubmit: () => void
  txToken: Token | null
  values: Record<string, string>
}
const ReviewSpendingLimit = ({
  onBack,
  onClose,
  onSubmit,
  txToken,
  values,
}: ReviewSpendingLimitProps): React.ReactElement => {
  const classes = useStyles()
  const addressBook = useSelector(getAddressBook)

  return (
    <>
      <TitleSection>
        <Title size="xs" withoutMargin>
          New Spending Limit{' '}
          <Text size="lg" color="secondaryLight">
            2 of 2
          </Text>
        </Title>

        <StyledButton onClick={onClose}>
          <Icon size="sm" type="cross" />
        </StyledButton>
      </TitleSection>

      <Block className={classes.container}>
        <Col margin="lg">
          <Text size="lg" color="secondaryLight">
            Beneficiary
          </Text>
          <EthHashInfo
            hash={values.beneficiary}
            name={addressBook ? getNameFromAdbk(addressBook, values.beneficiary) : ''}
            showCopyBtn
            showEtherscanBtn
            showIdenticon
            textSize="lg"
            network={getNetwork()}
          />
        </Col>
        <Col margin="lg">
          <Text size="lg" color="secondaryLight">
            Amount
          </Text>
          {txToken !== null ? (
            <StyledImageName>
              <StyledImage alt={txToken.name} onError={setImageToPlaceholder} src={txToken.logoUri} />
              <Text size="lg">
                {values.amount} {txToken.symbol}
              </Text>
            </StyledImageName>
          ) : (
            <Skeleton animation="wave" variant="text" />
          )}
        </Col>
        <Col margin="lg">
          <Text size="lg" color="secondaryLight">
            Reset Time
          </Text>
          {values.withResetTime ? (
            <Row align="center" margin="md">
              <IconText
                iconSize="md"
                iconType="fuelIndicator"
                text={RESET_TIME_OPTIONS.find(({ value }) => value === values.resetTime).label}
                textSize="lg"
              />
            </Row>
          ) : (
            <Row align="center" margin="md">
              <Text size="lg">
                {/* TODO: review message */}
                One-time spending limit allowance
              </Text>
            </Row>
          )}
        </Col>
      </Block>

      <FooterSection>
        <FooterWrapper>
          <Button color="primary" size="md" onClick={onBack}>
            Back
          </Button>

          <Button color="primary" size="md" variant="contained" onClick={onSubmit}>
            Submit
          </Button>
        </FooterWrapper>
      </FooterSection>
    </>
  )
}
// TODO: propose refactor in safe-react-components based on this requirements
const formMutators: Record<string, Mutator<{ beneficiary: { name: string } }>> = {
  setBeneficiary: (args, state, utils) => {
    utils.changeValue(state, 'beneficiary', () => args[0])
  },
}
const NewSpendingLimitModal = ({ close, open }: { close: () => void; open: boolean }): React.ReactElement => {
  const classes = useStyles()

  const [step, setStep] = React.useState<'create' | 'review'>('create')
  const [values, setValues] = React.useState()
  const tokens = useSelector(extendedSafeTokensSelector)
  const [txToken, setTxToken] = React.useState(null)
  const handleReview = (values) => {
    setValues(values)
    if (values.token) {
      setTxToken(tokens.find((token) => token.address === values.token))
    }
    setStep('review')
  }
  const handleSubmit = () => {
    // TODO: here we do the magic. FINALLY!!!!
    console.log({ values })
  }

  return (
    <GnoModal
      handleClose={close}
      open={open}
      title="New Spending Limit"
      description="set rules for specific beneficiaries to access funds from this Safe without having to collect all signatures"
      paperClassName={classes.modal}
    >
      {step === 'create' && <NewSpendingLimit initialValues={values} onCancel={close} onReview={handleReview} />}
      {step === 'review' && (
        <ReviewSpendingLimit
          onBack={() => setStep('create')}
          onClose={close}
          onSubmit={handleSubmit}
          txToken={txToken}
          values={values}
        />
      )}
    </GnoModal>
  )
}
/**
 * New Spending Limit Form - END
 */

const SpendingLimit = (): React.ReactElement => {
  const classes = useStyles()
  const granted = useSelector(grantedSelector)
  const [showNewSpendingLimitModal, setShowNewSpendingLimitModal] = React.useState(false)

  const openNewSpendingLimitModal = () => {
    setShowNewSpendingLimitModal(true)
  }

  const closeNewSpendingLimitModal = () => {
    setShowNewSpendingLimitModal(false)
  }

  return (
    <>
      <Block className={classes.container}>
        <Title size="xs" withoutMargin>
          Spending Limit
        </Title>
        <InfoText size="lg">
          You can set rules for specific beneficiaries to access funds from this Safe without having to collect all
          signatures.
        </InfoText>
        <Steps>
          <SpendingLimitStep>
            <Img alt="Select Beneficiary" title="Beneficiary" height={96} src={Beneficiary} />
            <Text size="lg" color="placeHolder" strong center>
              Select Beneficiary
            </Text>
            <Text size="lg" color="placeHolder" center>
              Choose an account that will benefit from this allowance.
            </Text>
            <Text size="lg" color="placeHolder" center>
              The beneficiary does not have to be an owner of this Safe
            </Text>
          </SpendingLimitStep>
          <StepsLine />
          <SpendingLimitStep>
            <Img alt="Select asset and amount" title="Asset and Amount" height={96} src={AssetAmount} />
            <Text size="lg" color="placeHolder" strong center>
              Select asset and amount
            </Text>
            <Text size="lg" color="placeHolder" center>
              You can set a spending limit for any asset stored in your Safe
            </Text>
          </SpendingLimitStep>
          <StepsLine />
          <SpendingLimitStep>
            <Img alt="Select time" title="Time" height={96} src={Time} />
            <Text size="lg" color="placeHolder" strong center>
              Select time
            </Text>
            <Text size="lg" color="placeHolder" center>
              You can choose to set a one-time spending limit or to have it automatically refill after a defined
              time-period
            </Text>
          </SpendingLimitStep>
        </Steps>
      </Block>
      <Row align="end" className={classes.buttonRow} grow>
        <Col end="xs">
          <Button
            className={classes.actionButton}
            color="primary"
            disabled={!granted}
            size="md"
            data-testid="new-spending-limit-button"
            onClick={openNewSpendingLimitModal}
            variant="contained"
          >
            New spending limit
          </Button>
        </Col>
      </Row>
      {showNewSpendingLimitModal && <NewSpendingLimitModal close={closeNewSpendingLimitModal} open={true} />}
    </>
  )
}

export default SpendingLimit
