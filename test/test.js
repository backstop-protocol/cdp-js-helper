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
    assert(closeEnough(web3.utils.fromWei(userInfoAfter.bCdpInfo.daiDebt.toString(10)),web3.utils.fromWei(web3.utils.toWei("300").toString(10))),"user eth balance is expected to be 2")
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

  it('calcNewBorrowLimitAndLiquidationPrice', async function () {
    const user = accounts[2]

    let userInfo = await B.getUserInfo(web3,user)

    const [maxDebt0,newLiqPrice0] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("1"),web3.utils.toWei("1"),web3)
    assert.equal(maxDebt0.toString(10),"0")
    assert.equal(newLiqPrice0.toString(10),"0")

    const depositVal = web3.utils.toWei("2") // 2 ETH
    const txObject = B.firstDeposit(web3,user)
    //console.log({txObject})
    const gasConsumption = increaseABit(await txObject.estimateGas({value:depositVal,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:depositVal,from:user})
    await mineBlock()

    userInfo = await B.getUserInfo(web3,user)
    const cdp = userInfo.bCdpInfo.cdp
    console.log({cdp})

    console.log("proxy",userInfo.proxyInfo.userProxy)

    const withdrawalVal = web3.utils.toWei("150")
    const txObject2 = B.generateDai(web3,userInfo.proxyInfo.userProxy,cdp,withdrawalVal)
    const gasConsumption2 = increaseABit(await txObject2.estimateGas({from:user}))
    console.log({gasConsumption2})
    await txObject2.send({gas:gasConsumption2,from:user})
    await mineBlock()


    console.log("query user info again")
    userInfo = await B.getUserInfo(web3,user)

    const [maxDebt,newLiqPrice] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("0"),web3.utils.toWei("0"),web3)
    assert(closeEnough(web3.utils.fromWei(newLiqPrice),(150 * 1.5/2).toString()))

    const [maxDebt2,newLiqPrice2] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("4"),web3.utils.toWei("0"),web3)
    assert(closeEnough(web3.utils.fromWei(newLiqPrice2),(150 * 1.5/6).toString()))

    const [maxDebt3,newLiqPrice3] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("-1"),web3.utils.toWei("0"),web3)
    assert(closeEnough(web3.utils.fromWei(newLiqPrice3),(150 * 1.5).toString()))

    const [maxDebt4,newLiqPrice4] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("0"),web3.utils.toWei("150"),web3)
    assert(closeEnough(web3.utils.fromWei(newLiqPrice4),(300 * 1.5/2).toString()))

    const [maxDebt5,newLiqPrice5] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("0"),web3.utils.toWei("-50"),web3)
    assert(closeEnough(web3.utils.fromWei(newLiqPrice5),(100 * 1.5/2).toString()))

    const [maxDebt6,newLiqPrice6] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("1.5"),web3.utils.toWei("-50"),web3)
    assert(closeEnough(web3.utils.fromWei(newLiqPrice6),(100 * 1.5/3.5).toString()))

    userInfo.miscInfo.spotPrice = web3.utils.toWei("100.5")
    userInfo.bCdpInfo.maxDaiDebt = web3.utils.toWei("134")

    const [maxDebt7,newLiqPrice7] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("1"),web3.utils.toWei("-1"),web3)
    assert.equal(web3.utils.fromWei(maxDebt7),(3*100.5 / 1.5).toString())
    const [maxDebt8,newLiqPrice8] = B.calcNewBorrowLimitAndLiquidationPrice(userInfo,web3.utils.toWei("-1"),web3.utils.toWei("-1"),web3)
    assert.equal(web3.utils.fromWei(maxDebt8),(1*100.5 / 1.5).toString())
  })

  it('input verification', async function () {
    const user = accounts[3]

    const depositVal = web3.utils.toWei("2") // 2 ETH
    const txObject = B.firstDeposit(web3,user)
    //console.log({txObject})
    const gasConsumption = increaseABit(await txObject.estimateGas({value:depositVal,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:depositVal,from:user})
    await mineBlock()

    let userInfo = await B.getUserInfo(web3,user)
    const cdp = userInfo.bCdpInfo.cdp
    console.log({cdp})

    const [succ91,msg91] = B.verifyBorrowInput(userInfo, web3.utils.toWei("50"),web3)
    assert(! succ91, "verifyBorrowInput should fail")
    assert.equal(msg91,"A Vault requires a minimum of 100 Dai to be generated")

    console.log("proxy",userInfo.proxyInfo.userProxy)

    const withdrawalVal = web3.utils.toWei("150")
    const txObject2 = B.generateDai(web3,userInfo.proxyInfo.userProxy,cdp,withdrawalVal)
    const gasConsumption2 = increaseABit(await txObject2.estimateGas({from:user}))
    console.log({gasConsumption2})
    await txObject2.send({gas:gasConsumption2,from:user})
    await mineBlock()


    console.log("query user info again")
    userInfo = await B.getUserInfo(web3,user)

    // verify deposit
    const [succ1,msg1] = B.verifyDepositInput(userInfo, web3.utils.toWei("-1"),web3)
    assert(! succ1, "verifyDepositInput should fail")
    assert.equal(msg1,"Deposit amount must be positive")

    const balancePlusOne = web3.utils.toBN(userInfo.userWalletInfo.ethBalance).add(web3.utils.toBN(1e10))
    const [succ2,msg2] = B.verifyDepositInput(userInfo, balancePlusOne.toString(10),web3)
    assert(! succ2, "verifyDepositInput should fail")
    assert.equal(msg2,"Amount exceeds wallet balance")

    const balanceMinusOne = web3.utils.toBN(userInfo.userWalletInfo.ethBalance).sub(web3.utils.toBN(1e10))
    const [succ3,msg3] = B.verifyDepositInput(userInfo, balanceMinusOne.toString(10),web3)
    assert(succ3, "verifyDepositInput should pass")
    assert.equal(msg3,"")

    // verify withdraw ETH
    const [succ4,msg4] = B.verifyWithdrawInput(userInfo,web3.utils.toWei("-1"),web3)
    assert(! succ4, "verifyWithdrawInput should failed")
    assert.equal(msg4,"Withdraw amount must be positive")

    const [succ5,msg5] = B.verifyWithdrawInput(userInfo,web3.utils.toWei("2.001"),web3)
    assert(! succ5, "verifyWithdrawInput should failed")
    assert.equal(msg5,"Amount exceeds CDP deposit")

    const [succ6,msg6] = B.verifyWithdrawInput(userInfo,web3.utils.toWei("1.9"),web3)
    assert(! succ6, "verifyWithdrawInput should failed")
    assert.equal(msg6,"Amount exceeds allowed withdrawal")

    const [succ7,msg7] = B.verifyWithdrawInput(userInfo,web3.utils.toWei("0.1"),web3)
    assert(succ7, "verifyWithdrawInput should pass")

    // verify borrow dai
    const [succ8,msg8] = B.verifyBorrowInput(userInfo, web3.utils.toWei("-1"),web3)
    assert(! succ8, "verifyBorrowInput should fail")
    assert.equal(msg8,"Borrow amount must be positive")

    const [succ9,msg9] = B.verifyBorrowInput(userInfo, web3.utils.toWei("1000"),web3)
    assert(! succ9, "verifyBorrowInput should fail")
    assert.equal(msg9,"Amount exceeds allowed borrowed")

    const [succ10,msg10] = B.verifyBorrowInput(userInfo, web3.utils.toWei("100"),web3)
    assert(succ10, "verifyBorrowInput should pass")

    // verify repay dai
    const [succ11,msg11] = B.verifyRepayInput(userInfo,web3.utils.toWei("-1"),web3)
    assert(! succ11, "verifyRepayInput should failed")
    assert.equal(msg11,"Repay amount must be positive")

    userInfo.userWalletInfo.daiAllowance = web3.utils.toWei("190")
    const [succ12,msg12] = B.verifyRepayInput(userInfo,web3.utils.toWei("150.0001"),web3)
    assert(! succ12, "verifyRepayInput should failed")
    assert.equal(msg12,"Amount exceeds dai balance")

    userInfo.userWalletInfo.daiAllowance = web3.utils.toWei("100")
    const [succ13,msg13] = B.verifyRepayInput(userInfo,web3.utils.toWei("100.0001"),web3)
    assert(! succ13, "verifyRepayInput should failed")
    assert.equal(msg13,"Must unlock DAI")

    userInfo.userWalletInfo.daiAllowance = web3.utils.toWei("200")
    userInfo.userWalletInfo.daiBalance = web3.utils.toWei("200")
    const [succ14,msg14] = B.verifyRepayInput(userInfo,web3.utils.toWei("150.0001"),web3)
    assert(! succ14, "verifyRepayInput should failed")
    assert.equal(msg14,"Amount exceeds dai debt")

    userInfo.userWalletInfo.daiAllowance = web3.utils.toWei("200")
    userInfo.userWalletInfo.daiBalance = web3.utils.toWei("200")
    const [succ141,msg141] = B.verifyRepayInput(userInfo,web3.utils.toWei("100"),web3)
    assert(! succ141, "verifyRepayInput should failed")
    assert.equal(msg141,"You can repay all your outstanding debt or a maximum of 50 Dai")


    const [succ15,msg15] = B.verifyRepayInput(userInfo,web3.utils.toWei("40.0031"),web3)
    assert(succ15, "verifyRepayInput should pass")

    // leave under 1 dai - should pass
    const [succ16,msg16] = B.verifyRepayInput(userInfo,web3.utils.toWei("149.0031"),web3)
    assert(succ16, "verifyRepayInput should pass", msg16)
  })

  it('repayAllDai', async function () {
    const user = accounts[4]

    const depositVal = web3.utils.toWei("2") // 2 ETH
    const txObject = B.firstDeposit(web3,user)
    //console.log({txObject})
    let gasConsumption = increaseABit(await txObject.estimateGas({value:depositVal,from:user}))
    console.log({gasConsumption})
    await txObject.send({gas:gasConsumption,value:depositVal,from:user})
    await mineBlock()

    let userInfo = await B.getUserInfo(web3,user)
    const cdp = userInfo.bCdpInfo.cdp
    console.log({cdp})

    const withdrawalVal = web3.utils.toWei("150")
    const txObject2 = B.generateDai(web3,userInfo.proxyInfo.userProxy,cdp,withdrawalVal)
    const gasConsumption2 = increaseABit(await txObject2.estimateGas({from:user}))
    console.log({gasConsumption2})
    await txObject2.send({gas:gasConsumption2,from:user})
    await mineBlock()


    console.log("query user info again")
    userInfo = await B.getUserInfo(web3,user)
    assert.equal(userInfo.bCdpInfo.daiDebt.toString(10),web3.utils.toWei("150").toString(10),"user debt should be 150")

    // first unlock dai
    console.log("proxy",userInfo.proxyInfo.userProxy)
    const txObject3 = B.unlockDai(web3,userInfo.proxyInfo.userProxy)
    gasConsumption = increaseABit(await txObject3.estimateGas({value:0,from:user}))
    await txObject3.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()

    const txObject4 = B.repayAllDai(web3,userInfo.proxyInfo.userProxy,cdp)
    //console.log({txObject})
    gasConsumption = increaseABit(await txObject4.estimateGas({value:0,from:user}))
    console.log({gasConsumption})
    await txObject4.send({gas:gasConsumption,value:0,from:user})
    await mineBlock()

    const userInfoAfterAll = await B.getUserInfo(web3,user)
    //console.log({userInfoAfter})
    assert(userInfoAfterAll.bCdpInfo.hasCdp,"user is expected to have a cdp")
    //assert.equal(userInfoAfter.bCdpInfo.ethDeposit.toString(10),web3.utils.toWei("4").toString(10),"user eth balance is expected to be 2")
    assert.equal(userInfoAfterAll.bCdpInfo.daiDebt.toString(10),web3.utils.toWei("0").toString(10),"user debt should be 0 after repayAll")
  })
})

function increaseABit(number) {
  return parseInt(1.2 * Number(number))
}

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function closeEnough(a,b) {
  if(Number(a) > Number(b)) return closeEnough(b,a)
  if(Number(a)/Number(b) < 0.9999) return false

  return true;
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
