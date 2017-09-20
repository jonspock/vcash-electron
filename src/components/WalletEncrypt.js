import React from 'react'
import { translate } from 'react-i18next'
import { action, computed, observable } from 'mobx'
import { inject, observer } from 'mobx-react'
import { Button, Input, notification } from 'antd'

/** Wallet encrypting component. */
@translate(['wallet'], { wait: true })
@inject('rpc', 'wallet')
@observer
class WalletEncrypt extends React.Component {
  @observable passphrase = ''
  @observable repeat = ''

  constructor (props) {
    super(props)
    this.t = props.t
    this.rpc = props.rpc
    this.wallet = props.wallet

    /** Errors that will be shown to the user. */
    this.errShow = ['passphrasesNotMatching']
  }

  /**
   * Get present error or empty string if none.
   * @function errorStatus
   * @return {string} Error status.
   */
  @computed
  get errorStatus () {
    const len = { pass: this.passphrase.length, repeat: this.repeat.length }

    if (len.pass < 1 || len.repeat < 1) return 'emptyFields'
    if (len.pass !== len.repeat) return 'differentLengths'
    if (this.passphrase !== this.repeat) return 'passphrasesNotMatching'
    return ''
  }

  /**
   * Clear entered passphrases.
   * @function clear
   */
  @action
  clear = () => {
    this.setValues({ passphrase: '', repeat: '' })
  }

  /**
   * Set value(s) of observable properties.
   * @function setValues
   * @param {object} values - Key value combinations.
   */
  @action
  setValues = values => {
    const allowed = ['passphrase', 'repeat', 'rpcError']

    /** Set only values of allowed properties that differ from the present. */
    Object.keys(values).forEach(key => {
      if (allowed.includes(key) === true && this[key] !== values[key]) {
        this[key] = values[key]
      }
    })
  }

  /**
   * Encrypt the wallet.
   * @function encryptWallet
   */
  encryptWallet = () => {
    this.rpc.execute(
      [{ method: 'encryptwallet', params: [this.passphrase] }],
      response => {
        if (response[0].hasOwnProperty('result') === true) {
          /** Update wallet's lock status. */
          this.wallet.getLockStatus()

          /** Clear entered passphrases. */
          this.clear()

          /** Display a non-expiring restart notification. */
          notification.success({
            message: this.t('wallet:encrypted'),
            description: this.t('wallet:encryptedLong'),
            duration: 0
          })
        }
      }
    )
  }

  render () {
    /** Do not render if the wallet is encrypted. */
    if (this.wallet.isEncrypted === true) return null
    return (
      <div>
        <div className='flex'>
          <i className='material-icons md-16'>vpn_key</i>
          <p>
            {this.t('wallet:encryptLong')}
          </p>
        </div>
        <div className='flex-sb' style={{ margin: '10px 0 0 0' }}>
          <p style={{ width: '120px' }}>
            {this.t('wallet:passphrase')}
          </p>
          <Input
            onChange={e => this.setValues({ passphrase: e.target.value })}
            placeholder={this.t('wallet:passphraseLong')}
            style={{ flex: 1 }}
            value={this.passphrase}
          />
        </div>
        <div className='flex-sb' style={{ margin: '5px 0 0 0' }}>
          <p style={{ width: '120px' }}>
            {this.t('wallet:passphraseRepeat')}
          </p>
          <Input
            onChange={e => this.setValues({ repeat: e.target.value })}
            placeholder={this.t('wallet:passphraseRepeatLong')}
            style={{ flex: 1 }}
            value={this.repeat}
          />
        </div>
        <div className='flex-sb' style={{ margin: '5px 0 0 0' }}>
          <p className='red' style={{ margin: '0 0 0 120px' }}>
            {this.errShow.includes(this.errorStatus) === true &&
              this.t('wallet:' + this.errorStatus)}
          </p>
          <Button
            disabled={this.errorStatus !== ''}
            onClick={this.encryptWallet}
          >
            {this.t('wallet:encrypt')}
          </Button>
        </div>
      </div>
    )
  }
}

export default WalletEncrypt
