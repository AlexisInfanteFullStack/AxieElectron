const superagent = require('superagent');

//  -------------------------------------------------------------------------------------------------------

//  Axie api requests

//  -------------------------------------------------------------------------------------------------------

function get_axie_info(id) {
    const query = `
      query GetAxieDetail($axieId: ID!) {
      axie(axieId: $axieId) {
          ...AxieDetail
          __typename
      }
      }
  
      fragment AxieDetail on Axie {
      id
      image
      class
      name
      genes
      sireId
      matronId
      breedCount
      owner
      auction {
        ...AxieAuction
        __typename
      }
      __typename
      }
  
      fragment AxieAuction on Auction {
        startingPrice
        endingPrice
        startingTimestamp
        endingTimestamp
        duration
        timeLeft
        currentPrice
        currentPriceUSD
        suggestedPrice
        seller
        listingIndex
        state
        __typename
      }    
    `
    const variables = {axieId: id}
    const request = superagent
                              .post('https://graphql-gateway.axieinfinity.com/graphql')
                              .send({query: query, variables: variables})
                              .set('accept', 'json');
  
    return request;    
}

//  -------------------------------------------------------------------------------------------------------
  
  
// By defining get_axie_info_promise the way we did, we ensure that all promises eventually resolve 
// without any errors, when the promise is rejected, the function is called all over again 
// until the promise eventually resolves
  
  
function get_axie_info_promise(axie_id) {
    
    const axie_info_request = get_axie_info(axie_id)
    .then( function(response) {
  
      // stop creating the same promise and return only when response is successful
  
      if (response) {
        if ( (response.statusCode == 200) && (response.body.data.axie) && (!response.body.hasOwnProperty('errors')) ) {
          return response;
        } else {
          // errors
          // console.log(`Evaded: ${JSON.stringify(response.body)} for axie: ${axie_id}`);
          return get_axie_info_promise(axie_id);
        }
  
      } else {
        return get_axie_info_promise(axie_id);
      }
  
    })
    .catch( function (err) {
      // errors
      // console.log(err);
      return get_axie_info_promise(axie_id);
    });
  
    return axie_info_request;
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_all_axies_info_promises(axies_ids) {
    const axies_info_promises = [];
  
    for (let i = 0; i < axies_ids.length; i++) {
      const axie_id = axies_ids[i];
    
      axies_info_promises.push( get_axie_info_promise(axie_id) )
    }
    return axies_info_promises;
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_ronin_axies(roninAddress, breedCount, auctionType, axieClasses, offset) {
    const query = `
      query GetAxieBriefList(
      $auctionType: AuctionType
      $criteria: AxieSearchCriteria
      $from: Int
      $sort: SortBy
      $size: Int
      $owner: String
      ) {
      axies(
          auctionType: $auctionType
          criteria: $criteria
          from: $from
          sort: $sort
          size: $size
          owner: $owner
      ) {
          total
          results {
          ...AxieBrief
          __typename
          }
          __typename
      }
      }
  
      fragment AxieBrief on Axie {
      id
      __typename
      }
    `;
    
    const criteria = {
      breedCount: breedCount,
      stages: 4,
      classes: axieClasses
    }
    const variables = {owner: roninAddress, size: 10000, from: offset, auctionType: auctionType, criteria: criteria, sort: 'IdAsc'}
    const request = superagent
                              .post('https://graphql-gateway.axieinfinity.com/graphql')
                              .send({query: query, variables: variables})
                              .set('accept', 'json');  
    return request;   
}
  
//  -------------------------------------------------------------------------------------------------------
  

exports.get_axie_info = get_axie_info;
exports.get_axie_info_promise = get_axie_info_promise;
exports.get_all_axies_info_promises = get_all_axies_info_promises;
exports.get_ronin_axies = get_ronin_axies;