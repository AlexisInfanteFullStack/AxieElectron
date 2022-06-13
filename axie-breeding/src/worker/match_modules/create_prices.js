const superagent = require('superagent');


//  -------------------------------------------------------------------------------------------------------
  
function convert_price(price) {
  
    const finalPrice = Number(price)/1000000000000000000;
  
    return finalPrice;
}
  
//  -------------------------------------------------------------------------------------------------------

function get_archetype_prices(axie_class, genes, breed_count) {

    // use for api request
    const archetype_variables = {
        // only take the first 3 to get average floor price
        size: 3,
        sort: 'PriceAsc',
        auctionType: 'Sale',
        criteria: {
            parts:
                [
                    genes.eyes.d.partId,
                    genes.ears.d.partId,
                    genes.mouth.d.partId,
                    genes.horn.d.partId,
                    genes.back.d.partId,
                    genes.tail.d.partId,
                ],
            stages: 4,
            classes: axie_class,
        }
    }

    // check if breed_count is relevant, if so, add it to archetype_variables
    // only relevant when getting prices for virgin (0 breed) axies
    // breed_count == -1 when irrelevant
    if (breed_count == 0) {
        archetype_variables.criteria.breedCount = 0;
    }


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
        auction {
            currentPrice
            currentPriceUSD
            __typename
        }

        __typename
        }
    `;

    const request = superagent
                                .post('https://graphql-gateway.axieinfinity.com/graphql')
                                .send({query: query, variables: archetype_variables})
                                .set('accept', 'json');  
    return request;   
}

//  -------------------------------------------------------------------------------------------------------

function get_archetype_prices_promise(axie_class, genes, breed_count) {

    // create prices promise
    const archetype_prices_request = get_archetype_prices(axie_class, genes, breed_count)
    .then( function(response) {

        // stop creating the same promise and return only when response is successful

        if (response) {
            if ( (response.statusCode == 200) && (!response.body.hasOwnProperty('errors')) && (response.body.data) ) {
                // NOTE: returning response.body.data.axies instead of response (different from when getting individual axies info) 
                return response.body.data.axies;
            } else {
                // errors
                // console.log(`Evaded: ${JSON.stringify(response.body)}`);
                return get_archetype_prices_promise(axie_class, genes, breed_count);
            }

        } else {
            return get_archetype_prices_promise(axie_class, genes, breed_count);
        }

    })
    .catch( function (err) {
        // errors
        // console.log(err);
        return get_archetype_prices_promise(axie_class, genes, breed_count);
    });

    return archetype_prices_request;
}

//  -------------------------------------------------------------------------------------------------------

function get_axie_archetype_key(axie) {

    return `class=${axie.class}_eyes=${axie.genes.eyes.d.partId}_ears=${axie.genes.ears.d.partId}_mouth=${axie.genes.mouth.d.partId}_horn=${axie.genes.horn.d.partId}_back=${axie.genes.back.d.partId}_tail=${axie.genes.tail.d.partId}`;
}

//  -------------------------------------------------------------------------------------------------------

function get_all_possible_archetypes(axies, all_possible_archetypes_keys, all_possible_archetypes_promises) {

    for (let i = 0; i < axies.length; i++) {
        const axie = axies[i];

        // create archetype key 
        const axie_archetype_key = get_axie_archetype_key(axie);

        // check if archetype has already been created
        // used to avoid requesting the same archetype multiple times if more than one axie has it
        if (all_possible_archetypes_keys[axie_archetype_key] == undefined) {
            all_possible_archetypes_keys[axie_archetype_key] = all_possible_archetypes_promises.length;

            // create promise for the floor prices of the current axie archetype
            all_possible_archetypes_promises.push(get_archetype_prices_promise(axie.class, axie.genes, -1));
        } 
    }
}

//  -------------------------------------------------------------------------------------------------------

function get_archetypes_average_prices(archetypes_prices) {

    const archetypes_average_prices = [];

    for (let i = 0; i < archetypes_prices.length; i++) {
        const archetype_prices = archetypes_prices[i].results;

        let archetype_prices_sum = 0;
        for (let j = 0; j < archetype_prices.length; j++) {

            archetype_prices_sum += convert_price(archetype_prices[j].auction.currentPrice);
        }

        // check if there are archetypes like this for sale to avoid dividing by zero if not
        let archetype_average_price;
        if (archetype_prices.length == 0) {
            archetype_average_price = 0;
        } else {
            archetype_average_price = archetype_prices_sum/archetype_prices.length;
        }

        archetypes_average_prices.push(archetype_average_price);
    }

    return archetypes_average_prices;
}

//  -------------------------------------------------------------------------------------------------------

function map_average_prices_to_archetypes_keys(archetypes_keys, archetypes_average_prices) {

    for (const archetype_key in archetypes_keys) {

        const archetype_average_price = archetypes_average_prices[archetypes_keys[archetype_key]];

        archetypes_keys[archetype_key] = archetype_average_price;
    }
}

//  -------------------------------------------------------------------------------------------------------


exports.get_axie_archetype_key = get_axie_archetype_key;
exports.get_all_possible_archetypes = get_all_possible_archetypes;
exports.get_archetypes_average_prices = get_archetypes_average_prices;
exports.map_average_prices_to_archetypes_keys = map_average_prices_to_archetypes_keys;