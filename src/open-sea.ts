import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  OrderApprovedPartOne as OrderApprovedPartOneEvent,
  OrderApprovedPartTwo as OrderApprovedPartTwoEvent,
  OrderCancelled as OrderCancelledEvent,
  OrdersMatched as OrdersMatchedEvent,
  OwnershipRenounced as OwnershipRenouncedEvent,
  OwnershipTransferred as OwnershipTransferredEvent
} from "../generated/OpenSea/OpenSea"
import {
  OrderApprovedPartOne,
  OrderApprovedPartTwo,
  OrderCancelled,
  OrdersMatched,
  OwnershipRenounced,
  OwnershipTransferred
} from "../generated/schema"
import {
	getOrCreateUser,
  updateBuyerAggregates,
	updateSellerAggregates
} from './helper/accountHelper'
import {
	getOrCreateCollection,
	updateCollectionAggregates,
} from './helper/collectionHelper'
import { getOrCreateNft, updateNftMetrics } from './helper/nftHelper'
import { getOrCreateSale, updateSale } from './helper/saleHelper'
import GlobalConstants from './utils'

export function handleOrderApprovedPartOne(
  event: OrderApprovedPartOneEvent
): void {
  let entity = new OrderApprovedPartOne(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hash = event.params.hash
  entity.exchange = event.params.exchange
  entity.maker = event.params.maker
  entity.taker = event.params.taker
  entity.makerRelayerFee = event.params.makerRelayerFee
  entity.takerRelayerFee = event.params.takerRelayerFee
  entity.makerProtocolFee = event.params.makerProtocolFee
  entity.takerProtocolFee = event.params.takerProtocolFee
  entity.feeRecipient = event.params.feeRecipient
  entity.feeMethod = event.params.feeMethod
  entity.side = event.params.side
  entity.saleKind = event.params.saleKind
  entity.target = event.params.target

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOrderApprovedPartTwo(
  event: OrderApprovedPartTwoEvent
): void {
  let entity = new OrderApprovedPartTwo(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hash = event.params.hash
  entity.howToCall = event.params.howToCall
  entity.calldata = event.params.calldata
  entity.replacementPattern = event.params.replacementPattern
  entity.staticTarget = event.params.staticTarget
  entity.staticExtradata = event.params.staticExtradata
  entity.paymentToken = event.params.paymentToken
  entity.basePrice = event.params.basePrice
  entity.extra = event.params.extra
  entity.listingTime = event.params.listingTime
  entity.expirationTime = event.params.expirationTime
  entity.salt = event.params.salt
  entity.orderbookInclusionDesired = event.params.orderbookInclusionDesired

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOrderCancelled(event: OrderCancelledEvent): void {
  let entity = new OrderCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hash = event.params.hash

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOrdersMatched(event: OrdersMatchedEvent): void {
  let entity = new OrdersMatched(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyHash = event.params.buyHash
  entity.sellHash = event.params.sellHash
  entity.maker = event.params.maker
  entity.taker = event.params.taker
  entity.price = event.params.price
  entity.metadata = event.params.metadata

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let buyHash = event.params.buyHash
	let sellHash = event.params.sellHash
  let maker = event.params.maker
	let taker = event.params.taker
  let price = GlobalConstants.convertPriceToBigDecimal(event.params.price)
  let metadata = event.params.metadata
  let receipt = event.receipt

  if (receipt) {
    for (let index = 0; index < receipt.logs.length; index++) {
      const _tokenID = receipt.logs[index].topics[0]
	    const tokenId = ethereum.decode('uin256', _tokenID)!.toBigInt()
      let buyer = getOrCreateUser(maker)
      let seller = getOrCreateUser(taker)
      let collection = getOrCreateCollection(metadata.toHexString())
      let nft = getOrCreateNft(tokenId, collection, maker)
      let sale = getOrCreateSale(event)
      
      updateCollectionAggregates(collection, buyer, price, nft)
      updateNftMetrics(buyer, sale, tokenId, collection, nft)
      updateSellerAggregates(seller, price)
      updateBuyerAggregates(buyer, price)
      updateSale(sale, buyHash, sellHash, buyer, seller, price, collection)
      buyer.save()
      seller.save()
      collection.save()
      nft.save()
      sale.save()
    }
  }
}

export function handleOwnershipRenounced(event: OwnershipRenouncedEvent): void {
  let entity = new OwnershipRenounced(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
