import React, { Component } from "react";

const fetch = require("node-fetch");
const Airtable = require("airtable");

const airtableAPIKey = "keyxhjBLut01NgQyA";

export default class ButtonLoader extends Component {
  state = {
    loading: false
  };

  fetchData = () => {
    this.setState({ loading: true });

    // do the big import here
    this.importTransactions();
  };

  render() {
    const { loading } = this.state;

    return (
      <div style={{ marginTop: "60px" }}>
        <button className="button" onClick={this.fetchData} disabled={loading}>
          {loading && (
            <i
              className="fa fa-refresh fa-spin"
              style={{ marginRight: "5px" }}
            />
          )}
          {loading && <span>Loading Data from Blockchain</span>}
          {!loading && <span>Fetch Data from Blockchain</span>}
        </button>
      </div>
    );
  }
  importTransactions() {
    var base = new Airtable({ apiKey: airtableAPIKey }).base(
      "appTr0D9NJyd6sPTr"
    );

    const WIPPContractETH = "0xD9c6E5E525bF60716351Cd316110Bd461389D94f";
    const OpenSeaURL =
      "https://api.opensea.io/api/v1/events?asset_contract_address=" +
      WIPPContractETH +
      "&event_type=successful&only_opensea=false&offset=0&limit=20";
    const options = { method: "GET", headers: { Accept: "application/json" } };

    const transactions = [];
    fetch(OpenSeaURL, options)
      .then((res) => res.json())
      .then((json) => {
        // console.log(json.asset_events[1]);
        json.asset_events.forEach((item) => {
          var totalprice = item.total_price / 10 ** item.payment_token.decimals;
          var totalpriceUSD = totalprice * item.payment_token.usd_price;
          var timestamp = item.transaction.timestamp;
          var currency = item.payment_token.symbol;

          // process bundles
          if (item.asset_bundle != null) {
            var numAssets = item.asset_bundle.assets.length;
            var pricePerAsset = totalprice / numAssets; // in ETH
            var priceUSDPerAsset = totalpriceUSD / numAssets;
            item.asset_bundle.assets.forEach((asset) => {
              transactions.push({
                fields: {
                  DatePurchased: timestamp,
                  Currency: currency,
                  SalePrice: pricePerAsset,
                  TokenID: asset.token_id,
                  ContractAddress: asset.asset_contract.address,
                  TransactionHash: item.transaction.transaction_hash,
                  Books: asset.name
                }
              });
            });
          }

          // process individual item purchase
          if (item.asset !== null) {
            transactions.push({
              fields: {
                DatePurchased: timestamp,
                Currency: currency,
                SalePrice: pricePerAsset,
                TokenID: item.asset.token_id,
                ContractAddress: item.asset.asset_contract.address,
                TransactionHash: item.transaction.transaction_hash,
                Books: item.asset.name
              }
            });
          }
          // question: peg price at ETH/USD at time of sale?
        });
        const paginate = (items, page = 1, perPage = 10) => {
          const offset = perPage * (page - 1);
          const totalPages = Math.ceil(items.length / perPage);
          const paginatedItems = items.slice(offset, perPage * page);

          return {
            previousPage: page - 1 ? page - 1 : null,
            nextPage: totalPages > page ? page + 1 : null,
            total: items.length,
            totalPages: totalPages,
            items: paginatedItems
          };
        };

        var paginatedTx = paginate(transactions, 1, 10);
        for (var page = 1; page <= paginatedTx.totalPages; page++) {
          // move to airtable - 10 records at a time
          base("WIP - Transactions - dev").create(paginatedTx.items, function (
            err,
            records
          ) {
            if (err) {
              console.log(err);
              //console.error(err);
              return;
            }
            records.forEach(function (record) {
              console.log(record.getId());
            });
          });
          paginatedTx = paginate(transactions, ++page, 10);
        }
      })
      .catch((err) => console.error("error:" + err));
  }
}
