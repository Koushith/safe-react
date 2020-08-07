import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuItem from '@material-ui/core/MenuItem'
import { makeStyles } from '@material-ui/core/styles'
import { List } from 'immutable'
import React from 'react'
import { Token } from 'src/logic/tokens/store/model/token'

import { selectStyles, selectedTokenStyles } from './style'

import Field from 'src/components/forms/Field'
import SelectField from 'src/components/forms/SelectField'
import { required } from 'src/components/forms/validator'
import Img from 'src/components/layout/Img'
import Paragraph from 'src/components/layout/Paragraph'

import { formatAmount } from 'src/logic/tokens/utils/formatAmount'
import { setImageToPlaceholder } from 'src/routes/safe/components/Balances/utils'

const useSelectedTokenStyles = makeStyles(selectedTokenStyles)

interface SelectTokenProps {
  tokenAddress: string
  tokens: List<Token>
}

const SelectedToken = ({ tokenAddress, tokens }: SelectTokenProps): React.ReactElement => {
  const classes = useSelectedTokenStyles()
  const token = tokens.find(({ address }) => address === tokenAddress)

  return (
    <MenuItem className={classes.container}>
      {token ? (
        <>
          <ListItemIcon className={classes.tokenImage}>
            <Img alt={token.name} height={28} onError={setImageToPlaceholder} src={token.logoUri} />
          </ListItemIcon>
          <ListItemText
            className={classes.tokenData}
            primary={token.name}
            secondary={`${formatAmount(token.balance.toString())} ${token.symbol}`}
          />
        </>
      ) : (
        <Paragraph color="disabled" size="md" style={{ opacity: 0.5 }} weight="light">
          Select an asset*
        </Paragraph>
      )}
    </MenuItem>
  )
}

const useSelectStyles = makeStyles(selectStyles)

interface TokenSelectFieldProps {
  initialValue?: string
  isValid?: boolean
  tokens: List<Token>
}

const TokenSelectField = ({ initialValue, isValid = true, tokens }: TokenSelectFieldProps): React.ReactElement => {
  const classes = useSelectStyles()

  return (
    <Field
      classes={{ selectMenu: classes.selectMenu }}
      className={isValid ? 'isValid' : 'isInvalid'}
      component={SelectField}
      displayEmpty
      initialValue={initialValue}
      name="token"
      renderValue={(tokenAddress) => <SelectedToken tokenAddress={tokenAddress} tokens={tokens} />}
      validate={required}
    >
      {tokens.map((token) => (
        <MenuItem key={token.address} value={token.address}>
          <ListItemIcon>
            <Img alt={token.name} height={28} onError={setImageToPlaceholder} src={token.logoUri} />
          </ListItemIcon>
          <ListItemText
            primary={token.name}
            secondary={`${formatAmount(token.balance.toString())} ${token.symbol}`}
            data-testid={`select-token-${token.name}`}
          />
        </MenuItem>
      ))}
    </Field>
  )
}

export default TokenSelectField
