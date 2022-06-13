const { get_axie_archetype_key } = require('./create_prices');


//  -------------------------------------------------------------------------------------------------------

//  Produce results and write to files

//  -------------------------------------------------------------------------------------------------------

function get_axies_discarded_by_purity_array(axies_discarded_by_purity, build) {

    // create array of axies left out of current build by purity
    let axies_discarded_by_purity_array = [];

    for (let j = 0; j < axies_discarded_by_purity.length; j++) {
      const discarded_axie = axies_discarded_by_purity[j];
  
      const discarded_axie_obj = {
        id: discarded_axie.id,
        ronin: discarded_axie.ronin,
        ronin_name: discarded_axie.ronin_name 
      }


      axies_discarded_by_purity_array.push( discarded_axie_obj );
    }
  
    return axies_discarded_by_purity_array;
}
  


//  -------------------------------------------------------------------------------------------------------
  
function get_results_array(cases_sorted_info, build, archetypes_keys, axies_discarded) {
  
    const results_array = [];

    const resultsTimestamp = String( Date.now() );


    for (let i = 0; i < cases_sorted_info.length; i++) {
  
      const current_cases_info = cases_sorted_info[i];
      const current_cases_sorting_property = current_cases_info.sorting_property;
      const current_cases_cases_sorted = current_cases_info.cases_sorted;
  

      // take into account the maximum amount of cases allowed,
      // if less cases were created than the maximum amount, consider all cases
      // otherwise, only consider the maximum amount specified in the build
      let amount_of_cases_to_be_considered;
      if (build.results.maximum_cases >= current_cases_cases_sorted.length) {
        amount_of_cases_to_be_considered = current_cases_cases_sorted.length;
      } else {
        amount_of_cases_to_be_considered = build.results.maximum_cases;
      }



      const current_result_cases_array = [];

      const current_result_type = get_result_type(current_cases_sorting_property);


      for (let j = 0; j < amount_of_cases_to_be_considered; j++) {
        const current_case = current_cases_cases_sorted[j]


        // axies
        const pairs = current_case.pairs;
        const axies_left_out = current_case.axies_left_out;
  

        // store slp and axs cost of each case (sum of cost of each pair in that case)
        let case_cost_slp = 0;
        let case_cost_axs = 0;
    

        // current case pairs array of objs
        const pairs_objs_array = [];

        for (let k = 0; k < pairs.length; k++) {
            const pair = pairs[k];
    
            // add costs 
            case_cost_slp += pair.info.breeds.cost_slp;
            case_cost_axs += pair.info.breeds.cost_axs;


            let axie_one_archetype_price,
                axie_two_archetype_price;

            // check if user wants to produce prices
            if (build.produce_prices) {
              // axie_one prices 
              axie_one_archetype_price = String(archetypes_keys[get_axie_archetype_key(pair.axie_one)]).slice(0,5);

              // axie_two prices
              axie_two_archetype_price = String(archetypes_keys[get_axie_archetype_key(pair.axie_two)]).slice(0,5);

            } else {
              // prices == 0 when user is not interested
              // axie_one prices
              axie_one_archetype_price = '0';

              // axie_two prices
              axie_two_archetype_price = '0';
            }



            const pair_obj = {
              axie_one: {
                  id: String(pair.axie_one.id),
                  ronin: String(pair.axie_one.ronin),
                  ronin_name: String(pair.axie_one.ronin_name),
                  price: axie_one_archetype_price
              },
              axie_two: {
                id: String(pair.axie_two.id),
                ronin: String(pair.axie_two.ronin),
                ronin_name: String(pair.axie_two.ronin_name),
                  price: axie_two_archetype_price
              },
              amount_of_breeds: String(pair.info.breeds.amount_of_breeds)
            }


            pairs_objs_array.push(pair_obj);
        }
  


        // create array axies not in current case
        const axies_left_out_array = [];

        for (let k = 0; k < axies_left_out.length; k++) {
            const axie_left_out = axies_left_out[k];

            const axie_left_out_obj = {
              id: String(axie_left_out.id),
              ronin: String(axie_left_out.ronin),
              ronin_name: String(axie_left_out.ronin_name)
            }

            axies_left_out_array.push(axie_left_out_obj);
        }



        const current_case_result_obj = {
          amount_of_pairs: String(current_case.amount_of_pairs),
          average_probability: String(current_case.average_probability),
          average_probability_difference: String(current_case.average_probability_difference),
          average_purity: String(current_case.average_purity),
          average_purity_difference: String(current_case.average_purity_difference),
          axs: String(case_cost_axs),
          slp: String(case_cost_slp),
          pairs: pairs_objs_array,
          axies_left_out: axies_left_out_array
        };


        current_result_cases_array.push(current_case_result_obj);
      }



      const result_obj = {
        id: `${i}-${resultsTimestamp}`,
        type: current_result_type,

        results: {
            minimum_purity: String(build.minimum_purity),
            axies_discarded: axies_discarded,
            cases: current_result_cases_array
        }
      }

      results_array.push(result_obj);
    }

    return results_array;
}
  


//  -------------------------------------------------------------------------------------------------------

function get_result_type(sorting_property) {

  if (sorting_property == 'average_probability') {
    return 'Probability';

  } else if (sorting_property == 'average_purity') {
    return 'Purity';
  }
}

  
//  -------------------------------------------------------------------------------------------------------


exports.get_axies_discarded_by_purity_array = get_axies_discarded_by_purity_array;
exports.get_results_array = get_results_array;
