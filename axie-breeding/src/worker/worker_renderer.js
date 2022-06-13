"use strict"

// worker renderer
// old match


const { ipcRenderer } = require('electron');



// axie api requests
const { get_all_axies_info_promises, get_ronin_axies } = require('./match_modules/api_requests');

// Axie class used throughout the matching process
const { Axie } = require('./match_modules/main_structures');

// create allowed axies / pairs based on build specifications
const { get_axies_based_on_minimum_purity, create_axie_pairs, get_build_allowed_pairs } = require('./match_modules/allowed_axies');

// create cases
const { get_cases } = require('./match_modules/create_cases');

// sorting algorithms
const { quicksort } = require('./match_modules/sorting_algorithms');

// info about cases and sort based on properties
const { get_build_cases_with_info, get_build_cases_sorted_by } = require('./match_modules/info_sort_cases');

// produce results / write to files
const { get_axies_discarded_by_purity_array, get_results_array } = require('./match_modules/produce_results');

// limit amount of cases to be considered
const { get_cases_to_be_considered } = require('./match_modules/cases_to_be_considered');

// create prices
const { get_all_possible_archetypes, get_archetypes_average_prices, map_average_prices_to_archetypes_keys } = require('./match_modules/create_prices');





//  -------------------------------------------------------------------------------------------------------

//  main

//  -------------------------------------------------------------------------------------------------------

async function main(buildsAndSelectedCasesObj) {

    // buildsAndSelectedCasesObj = {builds: [builds sorted], selectedCases: [selectedCases] }


    const buildsAndNewlyCreatedResults = []
    
    // buildAndTheirResultsCreated[i] = {build: buildObj, resultsCreated: [results]}


  
  for (let build_number = 0; build_number < buildsAndSelectedCasesObj.builds.length; build_number++) {

    const current_build = buildsAndSelectedCasesObj.builds[build_number];

    console.log(`Build '${current_build.name}'`);


    
    const current_build_axies = [];
    // store all axies of current build (manual axies and axies retrieved from specified ronins)
    // each entry is an Axie object (see ./match_modules/main_structures)



    console.log(`Axies manually included: ${current_build.include_axies.length}`);
    console.log(current_build.include_axies);


    // get info of axies entered manually in current build
    const current_build_manual_axies_promises = await Promise.all(get_all_axies_info_promises( [...current_build.include_axies] ));

    // after all promises are resolved, 
    // create Axie objects with the info obtained from each request

    for (let j = 0; j < current_build_manual_axies_promises.length; j++) {
        const axie_info = current_build_manual_axies_promises[j].body.data.axie;

        // create Axie objects with info of each axie and add it to current_build_axies
        // manual in ronin_name property as there's no name assigned to these axies ronins

        current_build_axies.push(new Axie(axie_info.id, axie_info.image, axie_info.class, axie_info.name, axie_info.genes, axie_info.sireId, axie_info.matronId, axie_info.breedCount, axie_info.auction, axie_info.owner, 'manual'));
    }



    // Get already selected axies
    // take into account excluded axies in build so they are not considered in any possible pairs
    const axies_already_selected = [...current_build.exclude_axies];   

    for (let i = 0; i < buildsAndSelectedCasesObj.selectedCases.length; i++) {
        const selectedCase = buildsAndSelectedCasesObj.selectedCases[i];

        for (let j = 0; j < selectedCase.case.pairs.length; j++) {
            const selectedPair = selectedCase.case.pairs[j];
            
            axies_already_selected.push(selectedPair.axie_one.id);
            axies_already_selected.push(selectedPair.axie_two.id);
        }
    }

    console.log(`Axies not considered: `);
    console.log(axies_already_selected);


    // get all of the axies info inside the current system
    // matched axie objects of all ronins in current build will be stores in current_build_axies
    for (let i = 0; i < current_build.ronins.length; i++) {
    
        // only get axies from current ronin if it's considered in build
        if (Boolean(current_build.ronins[i].consider)) {

            // current_ronin_axies_amount will store the amount of axies of the current ronin that match the current build
            let current_ronin_axies_amount;
            let current_ronin_axies_amount_response_successfull = false;
            // make request to see total axies matched inside the current ronin
            while (!current_ronin_axies_amount_response_successfull) {
                try {
                    const ronin_axies_response = await get_ronin_axies(current_build.ronins[i].address_hex,
                                                                        current_build.breed,
                                                                        current_build.auction,
                                                                        current_build.class,
                                                                        0);
                    // check response was successful 
                    if ( (ronin_axies_response.statusCode == 200) && (!ronin_axies_response.body.hasOwnProperty('errors')) ) {
                        current_ronin_axies_amount = ronin_axies_response.body.data.axies.total;
                        current_ronin_axies_amount_response_successfull = true;
            
                    } else {
                        throw `Query failed to run by returning code of ${ronin_axies_response.statusCode}`;
                    }
                    
                } catch (err) {
                    // errors
                    // console.log(err)
                }
            }
        
            console.log(`Ronin: '${current_build.ronins[i].name}', axies matched: ${current_ronin_axies_amount}`);
        

            // array to store the ids of the all the axies matched inside the current ronin
            const current_ronin_axies_ids = [];

            // create offset with the total axies matched already selected inside the current ronin
            // these axies are not the same as the axies in 'axies_already_selected'
            // will be of use when the total amount of axies matched in the current ronin excede 100
            // initial offset is 0 because no axies have been selected
            let current_ronin_offset = 0;
            
        
            while (current_ronin_axies_ids.length != current_ronin_axies_amount) {
        
                let current_ronin_axies_ids_with_offset;
                let current_ronin_axies_ids_with_offset_response_successfull = false;

                while(!current_ronin_axies_ids_with_offset_response_successfull) {
                    try {
                        // must be done one-by-one to avoid adding the same axie multiple times
                        const ronin_axies_ids_response_with_offset = await get_ronin_axies(current_build.ronins[i].address_hex,
                                                                                            current_build.breed,
                                                                                            current_build.auction,
                                                                                            current_build.class,
                                                                                            current_ronin_offset);
                        // check response was successful
                        if ( (ronin_axies_ids_response_with_offset.statusCode == 200) && (!ronin_axies_ids_response_with_offset.body.hasOwnProperty('errors')) ) {
                            current_ronin_axies_ids_with_offset = ronin_axies_ids_response_with_offset.body.data.axies.results;
                            current_ronin_axies_ids_with_offset_response_successfull = true;
                
                        } else {
                            throw `Query failed to run by returning code of ${ronin_axies_ids_response_with_offset.statusCode}. {}`;
                        }

                    } catch (err) {
                        // errors
                        // console.log(err)
                    }
                }

                // check if the axies matched with this offset have already been pushed to current_ronin_axies_ids
                // if not, then push them
                for (let l = 0; l < current_ronin_axies_ids_with_offset.length; l++) {
                    const current_axie_id = current_ronin_axies_ids_with_offset[l].id;

                    if (!current_ronin_axies_ids.includes(current_axie_id)) {
                        current_ronin_axies_ids.push(current_axie_id);
                    }
                }

                // change offset to not analyze already selected axies
                current_ronin_offset = current_ronin_axies_ids.length;

                console.log(`Ronin: '${current_build.ronins[i].name}', current axies count: ${current_ronin_axies_ids.length}`);
            }

        
            // check if axie has already been selected
            const current_ronin_axies_ids_not_selected = [];

            for (let j = 0; j < current_ronin_axies_ids.length; j++) {
                const current_axie_id = current_ronin_axies_ids[j];

                if (!axies_already_selected.includes(current_axie_id)) {
                    current_ronin_axies_ids_not_selected.push(current_axie_id);
                } else {
                    // axie has already been selected
                }
            }


            // array to store the request promises that when resolved will be the info of each axie of current_ronin_axies_ids_not_selected
            // wait for all promises to be resolved. 
            
            // By defining get_axie_info_promise the way we did, we ensure that all promises eventually resolve without any errors,
            // when the promise is rejected, the function is called all over again until the promise eventually resolves
            const current_ronin_axies_promises = await Promise.all( get_all_axies_info_promises(current_ronin_axies_ids_not_selected) );

            

            // after all promises are resolved, 
            // create Axie objects with the info obtained from each request
            const current_ronin_axies_info = [];

            for (let j = 0; j < current_ronin_axies_promises.length; j++) {
                const axie_info = current_ronin_axies_promises[j].body.data.axie;

                // get axie ronin name based on build ronins_names key/value pairs
                const axie_ronin_name = current_build.ronins_names[axie_info.owner];

                current_ronin_axies_info.push(new Axie(axie_info.id, axie_info.image, axie_info.class, axie_info.name, axie_info.genes, axie_info.sireId, axie_info.matronId, axie_info.breedCount, axie_info.auction, axie_info.owner, axie_ronin_name));
            }


            // more important than the total matched inside the ronin based on build.
            console.log(`Ronin: '${current_build.ronins[i].name}', axies not previously selected: ${current_ronin_axies_info.length}`);
            console.log(`Ronin: '${current_build.ronins[i].name}', axies previously selected: ${Number(current_ronin_axies_amount-current_ronin_axies_info.length)}`);

            // push all axies matched in current ronin to the array containing the total axies in the current build
            for (let j = 0; j < current_ronin_axies_info.length; j++) {
                current_build_axies.push(current_ronin_axies_info[j]);
            }

        } else {
            // current ronin is not considered
        }

    }

    
    // create arrays with build axies based on minimum purity field
    const current_build_axies_based_on_purity = get_axies_based_on_minimum_purity(current_build_axies, current_build);
    const current_build_axies_below_minimum_purity = current_build_axies_based_on_purity.axies_below_minimum_purity;
    const current_build_axies_above_minimum_purity = current_build_axies_based_on_purity.axies_above_minimum_purity;

    // create build's total pairs that are not siblings, and create each pair's info (purity, probability, breeds)
    // in future add check to make sure parent and children are not allowed either
    const current_build_axie_pairs = create_axie_pairs(current_build_axies_above_minimum_purity, current_build);

    // create build's total pairs that fall within the build's specifications (impurities, clashes, structures)
    const current_build_allowed_pairs = get_build_allowed_pairs(current_build_axie_pairs, current_build);

    console.log(`Total axies in build '${current_build.name}': ${current_build_axies.length}`);
    console.log(`Total axies in build '${current_build.name}', below minimum purity: ${current_build_axies_below_minimum_purity.length}`);
    console.log(`Total axies in build '${current_build.name}', above minimum purity: ${current_build_axies_above_minimum_purity.length}`);
    console.log(`Total allowed pairs in build '${current_build.name}': ${current_build_allowed_pairs.length}`);



    // create promises for archetypes prices
    // create hash table and map each archetype to avoid requesting prices multiple times for the same archetype

    // create keys for all possible archetypes
    const all_possible_archetypes_keys = {};
    const all_possible_archetypes_promises = [];

    // check if user wants to produce prices
    if (current_build.produce_prices) {

        // get all possible archetypes
        get_all_possible_archetypes(current_build_axies_above_minimum_purity, 
                                    all_possible_archetypes_keys, 
                                    all_possible_archetypes_promises);
    }



    // create build cases

    // maximum timestamp allowed for this build to run
    // execution time only taken into account for the process of creating the cases of the current build
    const current_build_maximum_timestamp = Math.floor( Date.now() / 1000 )  + current_build.maximum_execution_time;

    // create subsets (cases) of allowed pairs so that no subset contains more than one ocurrence of the same axie
    const initial_case = [];
    const current_build_cases_already_created = {};

    // store all cases in current_build_cases
    const current_build_cases = [];


    // create cases (execution time when current_build_allowed_pairs.length > 200 could be significant )
    get_cases(current_build_allowed_pairs, initial_case, current_build_cases, current_build_cases_already_created, current_build_maximum_timestamp);


    // console.log(current_build_cases);
    console.log(`total cases: ${current_build_cases.length}`);

    // Sort cases by length, largest cases first (cases with the most pairs)
    console.log(`Sorting cases in build '${current_build.name}'`);

    const current_build_cases_sorted_by_length = quicksort(current_build_cases, 
                                                            0, 
                                                            current_build_cases.length - 1, 
                                                            'length');

    console.log(`Finished sorting build '${current_build.name}'`);




    // wait for all prices promises to resolve for archetypes
    const all_possible_archetypes_prices = await Promise.all(all_possible_archetypes_promises);

    // get average prices for archetypes
    const all_possible_archetypes_average_prices = get_archetypes_average_prices(all_possible_archetypes_prices);

    // map archetypes keys to average prices
    map_average_prices_to_archetypes_keys(all_possible_archetypes_keys, all_possible_archetypes_average_prices);





    

    // get cases to be considered based on maximum amount allowed
    const current_build_cases_to_be_considered = get_cases_to_be_considered(current_build_cases_sorted_by_length, current_build);

    // get cases sorted by lenght with info properties such as purity, probability, amount of pairs
    const current_build_cases_sorted_by_length_with_info = get_build_cases_with_info(current_build_cases_to_be_considered, 
                                                                                    current_build_axies_above_minimum_purity);

    // sort cases based on sorting properties specified in current build
    const current_build_cases_sorted_by_all = get_build_cases_sorted_by(current_build_cases_sorted_by_length_with_info, 
                                                                    current_build.results.sorted_by);
    





                                                                    
    // get string of axies discarded by purity
    const current_build_axies_discarded_by_purity_array = get_axies_discarded_by_purity_array(current_build_axies_below_minimum_purity, current_build);

    // get current build results array 
    // pass archetypes to add prices next to each axie if user specified it on build
    const current_build_results_array = get_results_array(current_build_cases_sorted_by_all, 
                                                            current_build, 
                                                            all_possible_archetypes_keys, 
                                                            current_build_axies_discarded_by_purity_array);

        



    buildsAndNewlyCreatedResults.push( {build: current_build, resultsCreated: current_build_results_array} );
  }


  return buildsAndNewlyCreatedResults;
}









// match builds sent by main 

ipcRenderer.on('matchBuildsWorker', function(event, arg) {
    // arg = {builds: testBuilds, selectedCases: currentSelectedCases}
    


    console.log(`Matching process has started on worker`);
    // match builds here and produce results
    


    // match builds and produce results
    const buildsAndNewlyCreatedResults = main(arg);



    buildsAndNewlyCreatedResults.then( (value) => {

        // send result to main
        ipcRenderer.invoke('resultsFromWorker', value);

    });




});