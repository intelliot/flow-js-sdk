import * as sdk from "@onflow/sdk"
import * as t from "@onflow/types"
import {config} from "@onflow/config"

const Deps = {
    LOCKEDTOKENADDRESS: "0xLOCKEDTOKENADDRESS",
}

const Env = {
    local: {
        [Deps.LOCKEDTOKENADDRESS]: "0x0",
    },
    testnet: {
        [Deps.LOCKEDTOKENADDRESS]: "0x95e019a17d0e23d7",
    },
    mainnet: {
        [Deps.LOCKEDTOKENADDRESS]: "0x8d0e87b65159ae63",
    }
}

export const TITLE = "Redelegate Unstaked Flow"
export const DESCRIPTION = "Redelegates unstaked Flow for an account."
export const VERSION = "0.0.1"
export const HASH = "2027331b72d8710a1a05feb6ecebadb5858d134bc8c95d6f261319cd9fa1bb95"
export const CODE = 
`import LockedTokens from 0xLOCKEDTOKENADDRESS

transaction(amount: UFix64) {
    let nodeDelegatorProxy: LockedTokens.LockedNodeDelegatorProxy

    prepare(account: AuthAccount) {
        let holderRef = account.borrow<&LockedTokens.TokenHolder>(from: LockedTokens.TokenHolderStoragePath) 
            ?? panic("TokenHolder is not saved at specified path")

        self.nodeDelegatorProxy = holderRef.borrowDelegator()
    }

    execute {
        self.nodeDelegatorProxy.delegateUnstakedTokens(amount: amount)
    }
}
`

export const template = async ({ proposer, authorization, payer, amount = ""}) => {
    const env = await config().get("env", "mainnet")
    let code = CODE.replace(Deps.LOCKEDTOKENADDRESS, Env[env][Deps.LOCKEDTOKENADDRESS])

    return sdk.pipe([
        sdk.transaction(code),
        sdk.args([sdk.arg(amount, t.UFix64)]),
        sdk.proposer(proposer),
        sdk.authorizations([authorization]),
        sdk.payer(payer),
        sdk.validator((ix, {Ok, Bad}) => {
            if (ix.authorizations.length > 1) return Bad(ix, "template only requires one authorization.")
            return Ok(ix)
        })
    ])
}
