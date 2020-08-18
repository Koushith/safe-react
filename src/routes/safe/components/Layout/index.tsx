import { GenericModal } from '@gnosis.pm/safe-react-components'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom'

import Receive from '../Balances/Receive'

import { styles } from './style'
import { ModalState, OpenModalArgs } from './interfaces'

import Modal from 'src/components/Modal'
import NoSafe from 'src/components/NoSafe'
import Hairline from 'src/components/layout/Hairline'
import { providerNameSelector } from 'src/logic/wallets/store/selectors'
import SendModal from 'src/routes/safe/components/Balances/SendModal'
import LayoutHeader from 'src/routes/safe/components/Layout/Header'
import TabsComponent from 'src/routes/safe/components/Layout/Tabs'
import { safeParamAddressFromStateSelector } from 'src/logic/safe/store/selectors'
import { border } from 'src/theme/variables'
import { wrapInSuspense } from 'src/utils/wrapInSuspense'

export const SAFE_VIEW_NAME_HEADING_TEST_ID = 'safe-name-heading'

const Apps = React.lazy(() => import('../Apps'))
const Settings = React.lazy(() => import('../Settings'))
const Balances = React.lazy(() => import('../Balances'))
const TxsTable = React.lazy(() => import('src/routes/safe/components/Transactions/TxsTable'))
const Transactions = React.lazy(() => import('src/routes/safe/components/AllTransactions'))
const AddressBookTable = React.lazy(() => import('src/routes/safe/components/AddressBook'))

interface Props {
  sendFunds: Record<string, any>
  showReceive: boolean
  onShow: (value: string) => () => void
  onHide: (value: string) => () => void
  showSendFunds: (value: string) => void
  hideSendFunds: () => void
}

const useStyles = makeStyles(styles)

const Layout = (props: Props): React.ReactElement => {
  const classes = useStyles()
  const { hideSendFunds, onHide, onShow, sendFunds, showReceive, showSendFunds } = props
  const match = useRouteMatch()

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    body: null,
    footer: null,
    onClose: null,
  })

  const safeAddress = useSelector(safeParamAddressFromStateSelector)
  const provider = useSelector(providerNameSelector)
  if (!safeAddress) {
    return <NoSafe provider={provider} text="Safe not found" />
  }

  const openGenericModal = (modalConfig: OpenModalArgs): void => {
    setModal({ ...modalConfig, isOpen: true })
  }

  const closeGenericModal = (): void => {
    modal.onClose?.()

    setModal({
      isOpen: false,
      title: null,
      body: null,
      footer: null,
      onClose: null,
    })
  }

  return (
    <>
      <LayoutHeader onShow={onShow} showSendFunds={showSendFunds} />
      <TabsComponent />
      <Hairline color={border} style={{ marginTop: '-2px' }} />
      <Switch>
        <Route exact path={`${match.path}/balances/:assetType?`} render={() => wrapInSuspense(<Balances />, null)} />
        <Route exact path={`${match.path}/transactions`} render={() => wrapInSuspense(<TxsTable />, null)} />
        {process.env.REACT_APP_NEW_TX_TAB === 'enabled' && (
          <Route exact path={`${match.path}/all-transactions`} render={() => wrapInSuspense(<Transactions />, null)} />
        )}

        <Route
          exact
          path={`${match.path}/apps`}
          render={() => wrapInSuspense(<Apps closeModal={closeGenericModal} openModal={openGenericModal} />, null)}
        />
        <Route exact path={`${match.path}/settings`} render={() => wrapInSuspense(<Settings />, null)} />
        <Route exact path={`${match.path}/address-book`} render={() => wrapInSuspense(<AddressBookTable />, null)} />
        <Redirect to={`${match.path}/balances`} />
      </Switch>
      <SendModal
        activeScreenType="chooseTxType"
        isOpen={sendFunds.isOpen}
        onClose={hideSendFunds}
        selectedToken={sendFunds.selectedToken}
      />
      <Modal
        description="Receive Tokens Form"
        handleClose={onHide('Receive')}
        open={showReceive}
        paperClassName={classes.receiveModal}
        title="Receive Tokens"
      >
        <Receive onClose={onHide('Receive')} />
      </Modal>

      {modal.isOpen && <GenericModal {...modal} onClose={closeGenericModal} />}
    </>
  )
}

export default Layout
