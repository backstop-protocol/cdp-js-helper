'use strict'
// const Web3 = require('web3');
// const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const B = require('../bInterface.js')

contract('B Interface', function (accounts) {
  beforeEach('initing', async () => {
  })
  afterEach(async () => {
  })

  it('first deposit', async function () {
    const user = accounts[0]
    console.log("query user info")
    const userInfo = await B.getUserInfo(web3,user)
    assert(! userInfo.bCdpInfo.hasCdp, "user is not expected to have a cdp")
    assert(! userInfo.proxyInfo.hasProxy, "user is not expected to have a proxy")

    const depositVal = web3.utils.toWei("2") // 2 ETH
    const txObject = B.firstDeposit(web3,user)
    //console.log({txObject})
    const gasConsumption = increaseABit(await txObject.estimateGas({value:depositVal,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:depositVal,from:user})
    await mineBlock()
    // .on('confirmation', function(confirmationNumber, receipt)

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    //console.log({userInfoAfter})
    assert(userInfoAfter.bCdpInfo.hasCdp,"user is expected to have a cdp")
    assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),depositVal.toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfter.bCdpInfo.daiDebt.toString(10),"0","user debt balance is expected to be 0")
    assert(userInfoAfter.proxyInfo.hasProxy, "user is expected to have a proxy")
  })

  it('second deposit', async function () {
    const user = accounts[0]

    console.log("query user info")
    const userInfo = await B.getUserInfo(web3,user)
    const cdp = userInfo.bCdpInfo.cdp
    //console.log({cdp})

    const depositVal = web3.utils.toWei("5") // 5 ETH
    console.log("proxy",userInfo.proxyInfo.userProxy)
    const txObject = B.depositETH(web3,userInfo.proxyInfo.userProxy,cdp)
    //console.log({txObject})
    const gasConsumption = increaseABit(await txObject.estimateGas({value:depositVal,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:depositVal,from:user})
    await mineBlock()
    // .on('confirmation', function(confirmationNumber, receipt)

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    assert(userInfoAfter.bCdpInfo.hasCdp,"user is expected to have a cdp")
    assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("7").toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfter.bCdpInfo.daiDebt.toString(10),"0","user debt balance is expected to be 0")
    assert(userInfoAfter.proxyInfo.hasProxy, "user is expected to have a proxy")
  })

  it('ETH withdraw', async function () {
    const user = accounts[0]

    console.log("query user info")
    const userInfo = await B.getUserInfo(web3,user)
    const cdp = userInfo.bCdpInfo.cdp
    console.log({cdp})

    const withrawVal = web3.utils.toWei("3") // 3 ETH
    console.log("proxy",userInfo.proxyInfo.userProxy)

    const txObject = B.withdrawETH(web3,userInfo.proxyInfo.userProxy,cdp,withrawVal)
    //console.log({txObject})
    const gasConsumption = increaseABit(await txObject.estimateGas({value:0,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()
    // .on('confirmation', function(confirmationNumber, receipt)

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    assert(userInfoAfter.bCdpInfo.hasCdp,"user is expected to have a cdp")
    assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("4").toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfter.bCdpInfo.daiDebt.toString(10),"0","user debt balance is expected to be 0")
    assert(userInfoAfter.proxyInfo.hasProxy, "user is expected to have a proxy")
  })

  it('generate dai', async function () {
    const user = accounts[0]

    console.log("query user info")
    const userInfo = await B.getUserInfo(web3,user)
    //console.log(userInfo);
    const cdp = userInfo.bCdpInfo.cdp
    console.log({cdp})

    const withrawVal = web3.utils.toWei("300") // 300 dai
    console.log("proxy",userInfo.proxyInfo.userProxy)

    const txObject = B.generateDai(web3,userInfo.proxyInfo.userProxy,cdp,withrawVal)
    //console.log({txObject})
    const gasConsumption = increaseABit(await txObject.estimateGas({value:0,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()
    // .on('confirmation', function(confirmationNumber, receipt)

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    assert(userInfoAfter.bCdpInfo.hasCdp,"user is expected to have a cdp")
    //assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("4").toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfter.bCdpInfo.daiDebt.toString(10),web3.utils.toWei("300").toString(10),"user eth balance is expected to be 2")
    assert(userInfoAfter.proxyInfo.hasProxy, "user is expected to have a proxy")
  })

  it('repay dai', async function () {
    const user = accounts[0]

    console.log("query user info")
    const userInfo = await B.getUserInfo(web3,user)
    //console.log(userInfo);
    const cdp = userInfo.bCdpInfo.cdp
    console.log({cdp})

    // first unlock dai
    console.log("proxy",userInfo.proxyInfo.userProxy)
    const txObject1 = B.unlockDai(web3,userInfo.proxyInfo.userProxy)
    let gasConsumption = increaseABit(await txObject1.estimateGas({value:0,from:user}))
    await txObject1.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()

    const withrawVal = web3.utils.toWei("50") // 300 dai
    const txObject2 = B.repayDai(web3,userInfo.proxyInfo.userProxy,cdp,withrawVal)
    //console.log({txObject})
    gasConsumption = increaseABit(await txObject2.estimateGas({value:0,from:user}))
    console.log({gasConsumption})
    await txObject2.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()
    // .on('confirmation', function(confirmationNumber, receipt)

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    assert(userInfoAfter.bCdpInfo.hasCdp,"user is expected to have a cdp")
    //assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("4").toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfter.bCdpInfo.daiDebt.toString(10),web3.utils.toWei("250").toString(10),"user debt")
    assert(userInfoAfter.proxyInfo.hasProxy, "user is expected to have a proxy")

    // repay again, without unlockDai
    await txObject2.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()

    const userInfoAfterAfter = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    assert(userInfoAfterAfter.bCdpInfo.hasCdp,"user is expected to have a cdp")
    //assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("4").toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfterAfter.bCdpInfo.daiDebt.toString(10),web3.utils.toWei("200").toString(10),"user debt")
  })

  it('migrate fresh', async function () {
    const user = accounts[1] // new user
    const txMakerDao = B.openMakerDaoCdp(web3,user)
    const cdpVal = web3.utils.toWei("10")
    const makerDaoGasConsmption = increaseABit(await txMakerDao.estimateGas({value:cdpVal, from:user}))
    await txMakerDao.send({gas:makerDaoGasConsmption,value:cdpVal,from:user})

    await mineBlock()

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)

    assert(! userInfoAfter.bCdpInfo.hasCdp, "not expected to have B cdp")
    assert(userInfoAfter.makerdaoCdpInfo.hasCdp, "expected to have a maker cdp")
    assert.equal(userInfoAfter.makerdaoCdpInfo.ethDeposit.toString(10),web3.utils.toWei("10").toString(10),"user deposit is not as expected")

    const makerDaoCdp = userInfoAfter.makerdaoCdpInfo.cdp
    const proxy = userInfoAfter.proxyInfo.userProxy

    console.log({makerDaoCdp},{proxy})
    // do the migration
    const txMigrateFresh = B.migrateFresh(web3,proxy,makerDaoCdp)
    const migrateFreshGasConsmption = increaseABit(await txMigrateFresh.estimateGas({value:0,from:user}))
    await txMigrateFresh.send({gas:migrateFreshGasConsmption,value:0,from:user})

    await mineBlock()

    const userInfoAfterAfter = await B.getUserInfo(web3,user)

    assert.equal(userInfoAfterAfter.makerdaoCdpInfo.ethDeposit.toString(10),web3.utils.toWei("0").toString(10),"user deposit is not as expected")
    assert.equal(userInfoAfterAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("10").toString(10),"user deposit is not as expected")
  })

  it('migrate existing', async function () {
    const user = accounts[0] // new user
    const txMakerDao = B.openMakerDaoCdp(web3,user)
    const cdpVal = web3.utils.toWei("10")
    const makerDaoGasConsmption = increaseABit(await txMakerDao.estimateGas({value:cdpVal, from:user}))
    await txMakerDao.send({gas:makerDaoGasConsmption,value:cdpVal,from:user})

    await mineBlock()

    console.log("query user info again")
    const userInfoAfter = await B.getUserInfo(web3,user)

    assert(userInfoAfter.bCdpInfo.hasCdp, "not expected to have B cdp")
    assert(userInfoAfter.makerdaoCdpInfo.hasCdp, "expected to have a maker cdp")
    assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("4").toString(10),"user deposit is not as expected")
    assert.equal(userInfoAfter.makerdaoCdpInfo.ethDeposit.toString(10),web3.utils.toWei("10").toString(10),"user deposit is not as expected")

    const makerDaoCdp = userInfoAfter.makerdaoCdpInfo.cdp
    const proxy = userInfoAfter.proxyInfo.userProxy

    console.log({makerDaoCdp},{proxy})
    // do the migration
    const txMigrateFresh = B.migrateToExisting(web3,proxy,makerDaoCdp,userInfoAfter.bCdpInfo.cdp)
    const migrateFreshGasConsmption = increaseABit(await txMigrateFresh.estimateGas({value:0,from:user}))
    await txMigrateFresh.send({gas:migrateFreshGasConsmption,value:0,from:user})

    await mineBlock()

    const userInfoAfterAfter = await B.getUserInfo(web3,user)

    assert.equal(userInfoAfterAfter.makerdaoCdpInfo.ethDeposit.toString(10),web3.utils.toWei("0").toString(10),"user deposit is not as expected")
    assert.equal(userInfoAfterAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("14").toString(10),"user deposit is not as expected")
  })

})

function increaseABit(number) {
  return parseInt(1.1 * Number(number))
}

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function sendEth (from, to, amountInWei) {
  await web3.eth.sendTransaction({ from: from, to: to, value: amountInWei })
}

async function increaseTime (addSeconds) {
  const util = require('util')
  const providerSendAsync = util.promisify((getTestProvider()).send).bind(
    getTestProvider()
  )

  /*
      getTestProvider().send({
              jsonrpc: "2.0",
              method: "evm_increaseTime",
              params: [addSeconds], id: 0
          }, console.log)
  */
  await providerSendAsync({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [addSeconds],
    id: 1
  })
}

const Web3 = require('web3')
function getTestProvider () {
  return new Web3.providers.WebsocketProvider('ws://localhost:8545')
}

async function mineBlock () {
  const util = require('util')
  const providerSendAsync = util.promisify((getTestProvider()).send).bind(
    getTestProvider()
  )
  await providerSendAsync({
    jsonrpc: '2.0',
    method: 'evm_mine',
    params: [],
    id: 1
  })
}

function isRevertErrorMessage (error) {
  if (error.message.search('invalid opcode') >= 0) return true
  if (error.message.search('revert') >= 0) return true
  if (error.message.search('out of gas') >= 0) return true
  return false
};
