"use strict"

const superagent = require('superagent');


// axie api requests
const { get_all_axies_info_promises } = require('../match_modules/api_requests');

// sorting algorithms
const { quicksort } = require('../match_modules/sorting_algorithms');

// Axie class used throughout the matching process
const { Axie } = require('../match_modules/main_structures');





// handle match process

const axieOneInput = document.querySelector('#axie-one');
const axieTwoInput = document.querySelector('#axie-two');
const matchButton = document.querySelector('#match');

matchButton.addEventListener('click', function() {

  const axiePairInfo = getAxiePairInfo(axieOneInput.value, axieTwoInput.value)


  axiePairInfo.then( (info) => {

    
    const axiePairClasses = info.axiePairClasses;
    const axiePairTotalBuilds = info.axiePairTotalBuilds;


    const classResultsContainers = [];

    for (let i = 0; i < axiePairClasses.length; i++) {
      const axieClass = axiePairClasses[i];
      
      // class results container
      const classResultContainer = document.createElement('div');
      classResultContainer.classList.add('class-results-container');

      // class results header
      const classResultsHeader = document.createElement('div');
      classResultsHeader.classList.add('class-results-header');


      // header div 1
      const headerDivOne = document.createElement('div');
      headerDivOne.innerHTML = `<span>Class: <strong>${axieClass}</strong></span>`;

      // expand table btn
      const expandTable = document.createElement('span');
      expandTable.classList.add('expand-table');
      expandTable.textContent = '+';

      headerDivOne.appendChild(expandTable);

      // collapse table btn
      const collapseTable = document.createElement('span');
      collapseTable.classList.add('collapse-table');
      collapseTable.textContent = '-';

      headerDivOne.appendChild(collapseTable);


      // append header div one
      classResultsHeader.appendChild(headerDivOne);


      // header div two
      const headerDivTwo = document.createElement('div');
      headerDivTwo.innerHTML = `<span>Total Builds: <strong>${axiePairTotalBuilds.length}</strong></span>`;


      // append header div two
      classResultsHeader.appendChild(headerDivTwo);


      // append header
      classResultContainer.appendChild(classResultsHeader);


      // archetypes table
      const archetypesTable = document.createElement('table');
      archetypesTable.classList.add('archetypes-table');



      let axiePairArchetypesHTML = `
      <tr>
        <th>Eyes</th>
        <th>Ears</th>
        <th>Mouth</th>
        <th>Horn</th>
        <th>Back</th>
        <th>Tail</th>
        
        <th class="probability-entry">%</th>
        <th>Virgin</th>
        <th>Bred</th>
      </tr>
      `;
  
  
      for (let i = 0; i < axiePairTotalBuilds.length; i++) {
        const archetype = axiePairTotalBuilds[i];
        

        let archetypePrices;

        for (let j = 0; j < archetype.axiePrices.length; j++) {
          const prices = archetype.axiePrices[j];

          if (prices.axieClass == axieClass) {
            archetypePrices = prices;
            break
          }
        }


        const archetypeHTML = `
        <tr>
          <td class="${archetype.eyes.gene.cls}">${archetype.eyes.gene.name}</td>
          <td class="${archetype.ears.gene.cls}">${archetype.ears.gene.name}</td>
          <td class="${archetype.mouth.gene.cls}">${archetype.mouth.gene.name}</td>
          <td class="${archetype.horn.gene.cls}">${archetype.horn.gene.name}</td>
          <td class="${archetype.back.gene.cls}">${archetype.back.gene.name}</td>
          <td class="${archetype.tail.gene.cls}">${archetype.tail.gene.name}</td>
  
          <td class="probability-entry">${String(archetype.probability)}</td>
  

          <td> ${String(archetypePrices.virginAuctions.average_floor_price).slice(0, 6)} <br> ${String(archetypePrices.virginAuctions.amount_for_sale)} </td>

          <td> ${String(archetypePrices.bredAuctions.average_floor_price).slice(0, 6)} <br> ${String(archetypePrices.bredAuctions.amount_for_sale)} </td>
          
        </tr>
        `;

        axiePairArchetypesHTML += archetypeHTML;
      }


      archetypesTable.innerHTML = axiePairArchetypesHTML;
      

      // append archetypes table
      classResultContainer.appendChild(archetypesTable);


      // expand table functionality
      expandTable.addEventListener('click', function() {

        archetypesTable.style.display = 'table';
        expandTable.style.display = 'none';
        collapseTable.style.display = 'block';
      });


      // expand table functionality
      collapseTable.addEventListener('click', function() {

        archetypesTable.style.display = 'none';
        expandTable.style.display = 'block';
        collapseTable.style.display = 'none';
      });


      classResultsContainers.push(classResultContainer);
    }


    const oldMain = document.querySelector('main');
    if (oldMain) {
        oldMain.remove();
    }
    
    
    const body = document.querySelector('body');
    const newMain = document.createElement('main');

    // add newly created results
    for (let i = 0; i < classResultsContainers.length; i++) {
      const newResultContainer = classResultsContainers[i];

      newMain.appendChild(newResultContainer);
    }
    
    body.appendChild(newMain);
  });

});




//  -------------------------------------------------------------------------------------------------------


function get_pair_total_genes(pair) {

    const pair_total_genes = {}

    const purity_per_type_of_gene = {
        'd': 37.5,
        'r1': 9.375,
        'r2': 3.125
    }

    const body_parts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];

    for (let i = 0; i < body_parts.length; i++) {
        const body_part = body_parts[i];
        const current_body_part_genes = [];

        const current_body_part_axie_one_genes = pair.axie_one.genes[body_part];
        const current_body_part_axie_two_genes = pair.axie_two.genes[body_part];


        const type_of_genes = ['d', 'r1', 'r2']; 

        for (let j = 0; j < type_of_genes.length; j++) {
            const type_of_gene = type_of_genes[j];

            // add genes axie_one
            let axie_one_type_of_gene_included = false;
            let axie_one_repeated_gene_id; 
            for (let k = 0; k < current_body_part_genes.length; k++) {
                
                if ( current_body_part_genes[k].gene['partId']  == current_body_part_axie_one_genes[type_of_gene]['partId'] ) {
                    axie_one_type_of_gene_included = true;
                    axie_one_repeated_gene_id = k;
                    break;
                }
            }

            if (axie_one_type_of_gene_included) {
                current_body_part_genes[axie_one_repeated_gene_id].purity += purity_per_type_of_gene[type_of_gene];
            } else {
                const current_body_part_new_gene = {
                    gene: current_body_part_axie_one_genes[type_of_gene],
                    purity: purity_per_type_of_gene[type_of_gene]
                }

                current_body_part_genes.push(current_body_part_new_gene);
            }

            // add genes axie_two
            let axie_two_type_of_gene_included = false;
            let axie_two_repeated_gene_id; 
            for (let k = 0; k < current_body_part_genes.length; k++) {
                
                if ( current_body_part_genes[k].gene['partId']  == current_body_part_axie_two_genes[type_of_gene]['partId'] ) {
                    axie_two_type_of_gene_included = true;
                    axie_two_repeated_gene_id = k;
                    break;
                }
            }

            if (axie_two_type_of_gene_included) {
                current_body_part_genes[axie_two_repeated_gene_id].purity += purity_per_type_of_gene[type_of_gene];
            } else {
                const current_body_part_new_gene = {
                    gene: current_body_part_axie_two_genes[type_of_gene],
                    purity: purity_per_type_of_gene[type_of_gene]
                }

                current_body_part_genes.push(current_body_part_new_gene);
            }
        }

        pair_total_genes[body_part] = current_body_part_genes;
    }

    return pair_total_genes;
}

//  -------------------------------------------------------------------------------------------------------

function get_pair_total_builds(pair_genes) {

    const pair_total_builds = [];

    for (let i = 0; i < pair_genes.eyes.length; i++) {
        const eyes_genes = pair_genes.eyes[i];

        for (let j = 0; j < pair_genes.ears.length; j++) {
            const ears_genes = pair_genes.ears[j];

            for (let k = 0; k < pair_genes.mouth.length; k++) {
                const mouth_genes = pair_genes.mouth[k];

                for (let l = 0; l < pair_genes.horn.length; l++) {
                    const horn_genes = pair_genes.horn[l];

                    for (let m = 0; m < pair_genes.back.length; m++) {
                        const back_genes = pair_genes.back[m];

                        for (let n = 0; n < pair_genes.tail.length; n++) {
                            const tail_genes = pair_genes.tail[n];
                            
                            const build_probability = (eyes_genes.purity/100)*(ears_genes.purity/100)*(mouth_genes.purity/100)*(horn_genes.purity/100)*(back_genes.purity/100)*(tail_genes.purity/100)*100;

                            const build = {
                                eyes: eyes_genes,
                                ears: ears_genes,
                                mouth: mouth_genes,
                                horn: horn_genes,
                                back: back_genes,
                                tail: tail_genes,
                                probability: build_probability
                            }

                            pair_total_builds.push(build);
                        }
                    }
                }
            }
        }
    }

    return quicksort(pair_total_builds, 0, pair_total_builds.length-1, 'probability');
}

//  -------------------------------------------------------------------------------------------------------



//  -------------------------------------------------------------------------------------------------------

function get_build_prices(axie_class, build, breed_count) {
    

    // use for api request
    const build_variables = {
        // only take the first 5 to get average floor price
        size: 5,
        sort: 'PriceAsc',
        auctionType: 'Sale',
        criteria: {
            parts:
                // add eyes/ears for Axie Infinity: Origin
                [
                    build.eyes.gene.partId,
                    build.ears.gene.partId,
                    build.mouth.gene.partId,
                    build.horn.gene.partId,
                    build.back.gene.partId,
                    build.tail.gene.partId,
                ],
            stages: 4,
            classes: axie_class,
        }
    }

    // check if breed_count is relevant, if so, add it to build_variables
    // only relevant when getting prices for virgin (0 breed) axies

    // breed_count == -1 when irrelevant
    if (breed_count == 0) {
        build_variables.criteria.breedCount = 0;
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
                              .send({query: query, variables: build_variables})
                              .set('accept', 'json');  
    return request;   
}

//  -------------------------------------------------------------------------------------------------------
  
function get_build_prices_promise(axie_class, build, breed_count) {
    

    const build_prices_request = get_build_prices(axie_class, build, breed_count)
    .then( function(response) {
  
      // stop creating the same promise and return only when response is successful
  
      if (response) {
        if ( (response.statusCode == 200) && (!response.body.hasOwnProperty('errors')) && (response.body.data) ) {
            // NOTE: returning response.body.data.axies instead of response (different from when getting individual axies info) 
          return response.body.data.axies;
        } else {
            // errors
            // console.log(`Evaded: ${JSON.stringify(response.body)}`);
            return get_build_prices_promise(axie_class, build, breed_count);
        }
  
      } else {
        return get_build_prices_promise(axie_class, build, breed_count);
      }
  
    })
    .catch( function (err) {
        // errors
        // console.log(err);
      return get_build_prices_promise(axie_class, build, breed_count);
    });
  
    return build_prices_request;
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_all_build_prices_promises(axie_class, builds, breed_count) {
    const build_prices_promises = [];
  
    let amountOfPricesToGet;
    if (builds.length > 25) {
      amountOfPricesToGet = 25;
    } else {
      amountOfPricesToGet = builds.length;
    }



    for (let i = 0; i < amountOfPricesToGet; i++) {
      const build = builds[i];
    
      build_prices_promises.push( get_build_prices_promise(axie_class, build, breed_count) )
    }
    return build_prices_promises;
}


//  -------------------------------------------------------------------------------------------------------

function convert_price(price) {

  const finalPrice = Number(price)/1000000000000000000;

  return finalPrice
}

//  -------------------------------------------------------------------------------------------------------


function calculate_average_floor_prices_for_class(axieClass, pair_total_builds, pair_total_builds_prices_for_class) {
    
  let amountOfPricesGotten;
  if (pair_total_builds.length > 25) {
    amountOfPricesGotten = 25;

  } else {
    amountOfPricesGotten = pair_total_builds.length;
  }


  // calculate average floor prices for each build 
  for (let i = 0; i < amountOfPricesGotten; i++) {
      const build = pair_total_builds[i];

      // get average virgin floor price of current build
      const build_prices_virgin = pair_total_builds_prices_for_class.virgin[i].results;
      let build_prices_virgin_sum = 0;

      for (let j = 0; j < build_prices_virgin.length; j++) {  
          const axie_price_eth = convert_price(build_prices_virgin[j].auction.currentPrice);
          build_prices_virgin_sum += axie_price_eth;
      }

      let build_average_price_virgin 
      if (build_prices_virgin.length == 0) {
          build_average_price_virgin = 0;
      } else {
          build_average_price_virgin = build_prices_virgin_sum / build_prices_virgin.length;
      }


      // get average bred floor price of current build
      const build_prices_bred = pair_total_builds_prices_for_class.bred[i].results;
      let build_prices_bred_sum = 0;

      for (let j = 0; j < build_prices_bred.length; j++) {
          const axie_price_eth = convert_price(build_prices_bred[j].auction.currentPrice);
          build_prices_bred_sum += axie_price_eth;
      }

      let build_average_price_bred 
      if (build_prices_bred.length == 0) {
          build_average_price_bred = 0;
      } else {
          build_average_price_bred = build_prices_bred_sum / build_prices_bred.length;
      }
      

      // add auctions info to current build
      const virgin_auctions = {
          average_floor_price: build_average_price_virgin,
          amount_for_sale: pair_total_builds_prices_for_class.virgin[i].total
      }

      const bred_auctions = {
          average_floor_price: build_average_price_bred,
          amount_for_sale: pair_total_builds_prices_for_class.bred[i].total
      }


      const buildPricesForClass = {
        axieClass: axieClass,
        virginAuctions: virgin_auctions,
        bredAuctions: bred_auctions
      }

      build.axiePrices.push(buildPricesForClass);
      
  }


  // for builds that didnt get prices, add default values
  if (pair_total_builds.length > 25) {
   
    for (let i = 25; i < pair_total_builds.length; i++) {
      const build = pair_total_builds[i];


      const virgin_auctions = {
        average_floor_price: '...',
        amount_for_sale: '...'
      }

      const bred_auctions = {
          average_floor_price: '...',
          amount_for_sale: '...'
      }

      const buildPricesForClass = {
        axieClass: axieClass,
        virginAuctions: virgin_auctions,
        bredAuctions: bred_auctions
      }

      build.axiePrices.push(buildPricesForClass);
    }


  }


}

//  -------------------------------------------------------------------------------------------------------





//  -------------------------------------------------------------------------------------------------------

//  get pair info

//  -------------------------------------------------------------------------------------------------------

async function getAxiePairInfo(axieOneId, axieTwoId) {

    const axies_responses = await Promise.all(get_all_axies_info_promises( [axieOneId, axieTwoId] ));

    const axies = [];

    // create Axie objects for each of the ids
    for (let i = 0; i < axies_responses.length; i++) {
        const axie_info = axies_responses[i].body.data.axie;

        axies.push(new Axie(axie_info.id, axie_info.image, axie_info.class, axie_info.name, axie_info.genes, axie_info.sireId, axie_info.matronId, axie_info.breedCount, axie_info.auction, axie_info.owner));
    }

    const axie_pair = {
        axie_one: axies[0],
        axie_two: axies[1]
    }

    
    // get pair total genes
    const pair_total_genes = get_pair_total_genes(axie_pair);

    // get pair total builds
    const pair_total_builds = get_pair_total_builds(pair_total_genes);

    console.log('Total amount of builds:', pair_total_builds.length);


    // get builds prices for each class of resulting axie
    // if parent axies are of the same class there's only one possible outcome for the children class
    let axie_pair_classes;
    if (axie_pair.axie_one.class == axie_pair.axie_two.class) {
        axie_pair_classes = [axie_pair.axie_one.class];
    } else {
        axie_pair_classes = [axie_pair.axie_one.class, axie_pair.axie_two.class];
    }
    

    // add axie prices empty array to each build
    for (let i = 0; i < pair_total_builds.length; i++) {
      pair_total_builds[i].axiePrices = [];
    }

    // render just builds initially
    const pairInfo = {
      axiePairClasses: axie_pair_classes,
      axiePairTotalBuilds: pair_total_builds
    }


    // calculate prices

    for (let i = 0; i < pairInfo.axiePairClasses.length; i++) {
        const axie_class = pairInfo.axiePairClasses[i];

        
        // get virgin prices for all builds
        const pair_total_builds_prices_virgin_for_class = Promise.all(get_all_build_prices_promises(axie_class, 
                                                                                                    pairInfo.axiePairTotalBuilds,
                                                                                                    0));

        // get bred prices for all builds
        const pair_total_builds_prices_bred_for_class = Promise.all(get_all_build_prices_promises(axie_class, 
                                                                                                  pairInfo.axiePairTotalBuilds,
                                                                                                  -1));


        // wait for all promises to resolve (for both virgin and bred prices)
        let pair_total_builds_prices_for_class = await Promise.all( [pair_total_builds_prices_virgin_for_class, pair_total_builds_prices_bred_for_class] );

        pair_total_builds_prices_for_class = {
          virgin: pair_total_builds_prices_for_class[0],
          bred: pair_total_builds_prices_for_class[1]
        }


        // calculate average floor prices for each build
        calculate_average_floor_prices_for_class(axie_class, pairInfo.axiePairTotalBuilds, pair_total_builds_prices_for_class);
    }


    return pairInfo;
}

