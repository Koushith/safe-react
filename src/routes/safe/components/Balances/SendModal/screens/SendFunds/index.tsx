import { RadioButtons, Text } from '@gnosis.pm/safe-react-components'
import IconButton from '@material-ui/core/IconButton'
import InputAdornment from '@material-ui/core/InputAdornment'
import { makeStyles } from '@material-ui/core/styles'
import Close from '@material-ui/icons/Close'
import React, { useState } from 'react'
import { OnChange } from 'react-final-form-listeners'
import { useSelector } from 'react-redux'
import { safeSpendingLimitsSelector } from 'src/logic/safe/store/selectors'
import { ETH_ADDRESS } from 'src/logic/tokens/utils/tokenHelpers'
import { ZERO_ADDRESS } from 'src/logic/wallets/ethAddresses'
import { userAccountSelector } from 'src/logic/wallets/store/selectors'
import { fromTokenUnit } from 'src/routes/safe/components/Settings/SpendingLimit/utils'
import styled from 'styled-components'

import ArrowDown from '../assets/arrow-down.svg'

import { styles } from './style'

import CopyBtn from 'src/components/CopyBtn'
import EtherscanBtn from 'src/components/EtherscanBtn'
import Identicon from 'src/components/Identicon'
import { ScanQRWrapper } from 'src/components/ScanQRModal/ScanQRWrapper'
import Field from 'src/components/forms/Field'
import GnoForm from 'src/components/forms/GnoForm'
import TextField from 'src/components/forms/TextField'
import { composeValidators, minValue, maxValue, mustBeFloat, required } from 'src/components/forms/validator'
import Block from 'src/components/layout/Block'
import Button from 'src/components/layout/Button'
import ButtonLink from 'src/components/layout/ButtonLink'
import Col from 'src/components/layout/Col'
import Hairline from 'src/components/layout/Hairline'
import Paragraph from 'src/components/layout/Paragraph'
import Row from 'src/components/layout/Row'
import { getAddressBook } from 'src/logic/addressBook/store/selectors'
import { getNameFromAdbk } from 'src/logic/addressBook/utils'

import SafeInfo from 'src/routes/safe/components/Balances/SendModal/SafeInfo'
import AddressBookInput from 'src/routes/safe/components/Balances/SendModal/screens/AddressBookInput'
import TokenSelectField from 'src/routes/safe/components/Balances/SendModal/screens/SendFunds/TokenSelectField'
import { extendedSafeTokensSelector } from 'src/routes/safe/container/selector'
import { sm } from 'src/theme/variables'
import { BigNumber } from 'bignumber.js'

const formMutators = {
  setMax: (args, state, utils) => {
    utils.changeValue(state, 'amount', () => args[0])
  },
  onTokenChange: (args, state, utils) => {
    utils.changeValue(state, 'amount', () => state.formState.values.amount)
  },
  setRecipient: (args, state, utils) => {
    utils.changeValue(state, 'recipientAddress', () => args[0])
  },
  setTxType: (args, state, utils) => {
    utils.changeValue(state, 'txType', () => args[0])
  },
}

// const txTypeDecorator

// TODO: propose refactor in safe-react-components based on this requirements
const SpendingLimitRadioButtons = styled(RadioButtons)`
  & .MuiRadio-colorPrimary.Mui-checked {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const useStyles = makeStyles(styles as any)

const SendFunds = ({ initialValues, onClose, onNext, recipientAddress, selectedToken = '' }): React.ReactElement => {
  const classes = useStyles()
  const tokens = useSelector(extendedSafeTokensSelector)
  const addressBook = useSelector(getAddressBook)
  const [selectedEntry, setSelectedEntry] = useState({
    address: recipientAddress || initialValues.recipientAddress,
    name: '',
  })

  const [pristine, setPristine] = useState(true)
  const [isValidAddress, setIsValidAddress] = useState(true)

  React.useEffect(() => {
    if (selectedEntry === null && pristine) {
      setPristine(false)
    }
  }, [selectedEntry, pristine])

  let tokenSpendingLimit
  const handleSubmit = (values) => {
    const submitValues = values
    // If the input wasn't modified, there was no mutation of the recipientAddress
    if (!values.recipientAddress) {
      submitValues.recipientAddress = selectedEntry.address
    }
    onNext({ ...submitValues, tokenSpendingLimit })
  }

  const spendingLimits = useSelector(safeSpendingLimitsSelector)
  const currentUser = useSelector(userAccountSelector)

  return (
    <>
      <Row align="center" className={classes.heading} grow data-testid="modal-title-send-funds">
        <Paragraph className={classes.manage} noMargin weight="bolder">
          Send Funds
        </Paragraph>
        <Paragraph className={classes.annotation}>1 of 2</Paragraph>
        <IconButton disableRipple onClick={onClose}>
          <Close className={classes.closeIcon} />
        </IconButton>
      </Row>
      <Hairline />
      <GnoForm formMutators={formMutators} initialValues={initialValues} onSubmit={handleSubmit}>
        {(...args) => {
          const formState = args[2]
          const mutators = args[3]
          const { token: tokenAddress, txType } = formState.values
          const selectedTokenRecord = tokens?.find((token) => token.address === tokenAddress)
          tokenSpendingLimit =
            selectedTokenRecord &&
            spendingLimits?.find(
              ({ delegate, token }) =>
                delegate.toLowerCase() === currentUser.toLowerCase() &&
                (token === ZERO_ADDRESS ? ETH_ADDRESS : token.toLowerCase()) ===
                  selectedTokenRecord.address.toLowerCase(),
            )

          const handleScan = (value, closeQrModal) => {
            let scannedAddress = value

            if (scannedAddress.startsWith('ethereum:')) {
              scannedAddress = scannedAddress.replace('ethereum:', '')
            }
            const scannedName = addressBook ? getNameFromAdbk(addressBook, scannedAddress) : ''
            mutators.setRecipient(scannedAddress)
            setSelectedEntry({
              name: scannedName,
              address: scannedAddress,
            })
            closeQrModal()
          }

          let shouldDisableSubmitButton = !isValidAddress
          if (selectedEntry) {
            shouldDisableSubmitButton = !selectedEntry.address
          }

          return (
            <>
              <Block className={classes.formContainer}>
                <SafeInfo />
                <Row margin="md">
                  <Col xs={1}>
                    <img alt="Arrow Down" src={ArrowDown} style={{ marginLeft: sm }} />
                  </Col>
                  <Col center="xs" layout="column" xs={11}>
                    <Hairline />
                  </Col>
                </Row>
                {selectedEntry && selectedEntry.address ? (
                  <div
                    onKeyDown={(e) => {
                      if (e.keyCode !== 9) {
                        setSelectedEntry(null)
                      }
                    }}
                    role="listbox"
                    tabIndex={0}
                  >
                    <Row margin="xs">
                      <Paragraph color="disabled" noMargin size="md" style={{ letterSpacing: '-0.5px' }}>
                        Recipient
                      </Paragraph>
                    </Row>
                    <Row align="center" margin="md">
                      <Col xs={1}>
                        <Identicon address={selectedEntry.address} diameter={32} />
                      </Col>
                      <Col layout="column" xs={11}>
                        <Block justify="left">
                          <Block>
                            <Paragraph
                              className={classes.selectAddress}
                              noMargin
                              onClick={() => setSelectedEntry(null)}
                              weight="bolder"
                            >
                              {selectedEntry.name}
                            </Paragraph>
                            <Paragraph
                              className={classes.selectAddress}
                              noMargin
                              onClick={() => setSelectedEntry(null)}
                              weight="bolder"
                            >
                              {selectedEntry.address}
                            </Paragraph>
                          </Block>
                          <CopyBtn content={selectedEntry.address} />
                          <EtherscanBtn type="address" value={selectedEntry.address} />
                        </Block>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <>
                    <Row margin="md">
                      <Col xs={11}>
                        <AddressBookInput
                          fieldMutator={mutators.setRecipient}
                          pristine={pristine}
                          recipientAddress={recipientAddress}
                          setIsValidAddress={setIsValidAddress}
                          setSelectedEntry={setSelectedEntry}
                        />
                      </Col>
                      <Col center="xs" className={classes} middle="xs" xs={1}>
                        <ScanQRWrapper handleScan={handleScan} />
                      </Col>
                    </Row>
                  </>
                )}
                <Row margin="sm">
                  <Col>
                    <TokenSelectField
                      initialValue={selectedToken}
                      isValid={tokenAddress && String(tokenAddress).toUpperCase() !== 'ETHER'}
                      tokens={tokens}
                    />
                  </Col>
                </Row>
                {tokenSpendingLimit && (
                  <Row margin="sm">
                    <Col between="lg" style={{ flexDirection: 'column' }}>
                      <Text size="lg">Send as</Text>
                      <Field name="txType" initialValue="multiSig">
                        {({ input: { name, value } }) => (
                          <SpendingLimitRadioButtons
                            name={name}
                            value={value || 'multiSig'}
                            onRadioChange={mutators.setTxType}
                            options={[
                              { label: 'Multisig Transaction', value: 'multiSig' },
                              {
                                label: `Spending Limit Transaction (${fromTokenUnit(
                                  new BigNumber(tokenSpendingLimit.amount).minus(tokenSpendingLimit.spent).toString(),
                                  selectedTokenRecord.decimals,
                                )} ${selectedTokenRecord.symbol})`,
                                value: 'spendingLimit',
                              },
                            ]}
                          />
                        )}
                      </Field>
                    </Col>
                  </Row>
                )}
                <Row margin="xs">
                  <Col between="lg">
                    <Paragraph color="disabled" noMargin size="md" style={{ letterSpacing: '-0.5px' }}>
                      Amount
                    </Paragraph>
                    <ButtonLink
                      onClick={() =>
                        mutators.setMax(
                          tokenSpendingLimit && txType === 'spendingLimit'
                            ? new BigNumber(selectedTokenRecord.balance).gt(
                                fromTokenUnit(
                                  new BigNumber(tokenSpendingLimit.amount).minus(tokenSpendingLimit.spent).toString(),
                                  selectedTokenRecord.decimals,
                                ),
                              )
                              ? fromTokenUnit(
                                  new BigNumber(tokenSpendingLimit.amount).minus(tokenSpendingLimit.spent).toString(),
                                  selectedTokenRecord.decimals,
                                )
                              : selectedTokenRecord.balance
                            : selectedTokenRecord.balance,
                        )
                      }
                      weight="bold"
                      testId="send-max-btn"
                    >
                      Send max
                    </ButtonLink>
                  </Col>
                </Row>
                <Row margin="md">
                  <Col>
                    <Field
                      component={TextField}
                      inputAdornment={
                        selectedTokenRecord && {
                          endAdornment: <InputAdornment position="end">{selectedTokenRecord.symbol}</InputAdornment>,
                        }
                      }
                      name="amount"
                      placeholder="Amount*"
                      text="Amount*"
                      type="text"
                      testId="amount-input"
                      validate={composeValidators(
                        required,
                        mustBeFloat,
                        minValue(0, false),
                        maxValue(
                          tokenSpendingLimit && txType === 'spendingLimit'
                            ? new BigNumber(selectedTokenRecord.balance).gt(
                                fromTokenUnit(
                                  new BigNumber(tokenSpendingLimit.amount).minus(tokenSpendingLimit.spent).toString(),
                                  selectedTokenRecord.decimals,
                                ),
                              )
                              ? fromTokenUnit(
                                  new BigNumber(tokenSpendingLimit.amount).minus(tokenSpendingLimit.spent).toString(),
                                  selectedTokenRecord.decimals,
                                )
                              : selectedTokenRecord.balance
                            : selectedTokenRecord?.balance,
                        ),
                      )}
                    />
                    <OnChange name="token">
                      {() => {
                        setSelectedEntry({
                          name: selectedEntry?.name,
                          address: selectedEntry?.address,
                        })
                        mutators.onTokenChange()
                      }}
                    </OnChange>
                  </Col>
                </Row>
              </Block>
              <Hairline />
              <Row align="center" className={classes.buttonRow}>
                <Button minWidth={140} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className={classes.submitButton}
                  color="primary"
                  data-testid="review-tx-btn"
                  disabled={shouldDisableSubmitButton}
                  minWidth={140}
                  type="submit"
                  variant="contained"
                >
                  Review
                </Button>
              </Row>
            </>
          )
        }}
      </GnoForm>
    </>
  )
}

export default SendFunds
