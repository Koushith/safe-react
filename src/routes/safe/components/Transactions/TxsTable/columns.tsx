import format from 'date-fns/format'
import getTime from 'date-fns/getTime'
import parseISO from 'date-fns/parseISO'
import { List } from 'immutable'
import React from 'react'

import TxType from './TxType'

import { buildOrderFieldFrom } from 'src/components/Table/sorting'
import { TableColumn } from 'src/components/Table/types.d'
import { formatAmount, humanReadableTokenAmount } from 'src/logic/tokens/utils/formatAmount'
import { INCOMING_TX_TYPES } from 'src/logic/safe/store/models/incomingTransaction'
import { Transaction, TransactionStatus } from 'src/logic/safe/store/models/types/transaction'
import { CancellationTransactions } from 'src/logic/safe/store/reducer/cancellationTransactions'

export const TX_TABLE_ID = 'id'
export const TX_TABLE_TYPE_ID = 'type'
export const TX_TABLE_DATE_ID = 'date'
export const TX_TABLE_AMOUNT_ID = 'amount'
export const TX_TABLE_STATUS_ID = 'status'
export const TX_TABLE_RAW_TX_ID = 'tx'
export const TX_TABLE_RAW_CANCEL_TX_ID = 'cancelTx'
export const TX_TABLE_EXPAND_ICON = 'expand'

export const formatDate = (date: string): string => format(parseISO(date), 'MMM d, yyyy - HH:mm:ss')

const NOT_AVAILABLE = 'n/a'

interface AmountData {
  decimals?: number | string
  symbol?: string
  value: string
}

const getAmountWithSymbol = (
  { decimals = 0, symbol = NOT_AVAILABLE, value }: AmountData,
  formatted = false,
): string => {
  const humanReadableAmount = humanReadableTokenAmount(value, +decimals)
  const finalValue = formatted ? formatAmount(humanReadableAmount) : humanReadableAmount

  const txAmount = finalValue === 'NaN' ? NOT_AVAILABLE : finalValue

  return `${txAmount} ${symbol}`
}

export const getIncomingTxAmount = (tx: Transaction, formatted = true): string => {
  // simple workaround to avoid displaying unexpected values for incoming NFT transfer
  if (INCOMING_TX_TYPES[tx.type] === INCOMING_TX_TYPES.ERC721_TRANSFER) {
    return `1 ${tx.symbol}`
  }

  return getAmountWithSymbol(tx, formatted)
}

export const getTxAmount = async (tx: Transaction, formatted = true): Promise<string> => {
  const { decimals = 18, decodedParams, isTokenTransfer } = tx
  const { value } = (isTokenTransfer && !!decodedParams && !!decodedParams.transfer
    ? decodedParams.transfer
    : tx) as Transaction

  if (tx.isCollectibleTransfer) {
    return `1 ${tx.symbol}`
  }

  if (!isTokenTransfer && !(Number(value) > 0)) {
    return NOT_AVAILABLE
  }

  return getAmountWithSymbol({ decimals, value }, formatted)
}

type TableData = {
  id?: number
  type: React.ReactElement
  date: string
  dateOrder?: number
  amount: string
  status?: TransactionStatus
  tx: Transaction
  cancelTx?: Transaction
}

const getIncomingTxTableData = (tx: Transaction): TableData => ({
  [TX_TABLE_ID]: tx.blockNumber,
  [TX_TABLE_TYPE_ID]: <TxType txType="incoming" />,
  [TX_TABLE_DATE_ID]: formatDate(tx.executionDate),
  [buildOrderFieldFrom(TX_TABLE_DATE_ID)]: getTime(parseISO(tx.executionDate)),
  [TX_TABLE_AMOUNT_ID]: getIncomingTxAmount(tx),
  [TX_TABLE_STATUS_ID]: tx.status,
  [TX_TABLE_RAW_TX_ID]: tx,
})

const getTransactionTableData = async (tx: Transaction, cancelTx: Transaction): Promise<TableData> => {
  const txDate = tx.submissionDate

  return {
    [TX_TABLE_ID]: tx.blockNumber,
    [TX_TABLE_TYPE_ID]: <TxType origin={tx.origin} txType={tx.type} />,
    [TX_TABLE_DATE_ID]: txDate ? formatDate(txDate) : '',
    dateOrder: txDate ? getTime(parseISO(txDate)) : null,
    [TX_TABLE_AMOUNT_ID]: await getTxAmount(tx),
    [TX_TABLE_STATUS_ID]: tx.status,
    [TX_TABLE_RAW_TX_ID]: tx,
    [TX_TABLE_RAW_CANCEL_TX_ID]: cancelTx,
  }
}

export const getTxTableData = async (
  transactions: List<Transaction>,
  cancelTxs: CancellationTransactions,
): Promise<List<TableData>> => {
  const txsData = transactions.map(async (tx) => {
    if (INCOMING_TX_TYPES[tx.type] !== undefined) {
      return getIncomingTxTableData(tx)
    }

    return getTransactionTableData(tx, cancelTxs.get(`${tx.nonce}`))
  })

  return List(await Promise.all(txsData))
}

export const generateColumns = (): List<TableColumn> => {
  const nonceColumn = {
    id: TX_TABLE_ID,
    disablePadding: false,
    label: 'Id',
    custom: false,
    order: false,
    width: 50,
  }

  const typeColumn = {
    id: TX_TABLE_TYPE_ID,
    order: false,
    disablePadding: false,
    label: 'Type',
    custom: false,
    width: 200,
  }

  const valueColumn = {
    id: TX_TABLE_AMOUNT_ID,
    order: false,
    disablePadding: false,
    label: 'Amount',
    custom: false,
    width: 120,
  }

  const dateColumn = {
    id: TX_TABLE_DATE_ID,
    disablePadding: false,
    order: true,
    label: 'Date',
    custom: false,
  }

  const statusColumn = {
    id: TX_TABLE_STATUS_ID,
    order: false,
    disablePadding: false,
    label: 'Status',
    custom: true,
    align: 'right',
  }

  const expandIconColumn = {
    id: TX_TABLE_EXPAND_ICON,
    order: false,
    disablePadding: true,
    label: '',
    custom: true,
    width: 50,
    static: true,
  }

  return List([nonceColumn, typeColumn, valueColumn, dateColumn, statusColumn, expandIconColumn])
}
