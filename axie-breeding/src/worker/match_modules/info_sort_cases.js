const { quicksort } = require('./sorting_algorithms');

//  -------------------------------------------------------------------------------------------------------

//  Get info about cases

//  -------------------------------------------------------------------------------------------------------

function get_build_cases_with_info(cases, overall_axies) { 

    const build_cases_with_info = [];
  
    for (let i = 0; i < cases.length; i++) {
  
        const current_case = cases[i];
        const current_case_amount_of_pairs = current_case.length;
        
        // store purities and probabilities in arrays to calculate average difference
        // will be used to determine cases with least variations 
        const current_case_purities = [];
        const current_case_probabilities = [];
        // get sums of purities and probabilities of all pairs in the current case
        // will be used to calculate the average purities and probabilities of the current case
        let sum_of_current_case_purities = 0;
        let sum_of_current_case_probabilities = 0;
  
  
        for (let j = 0; j < current_case_amount_of_pairs; j++) {
          const current_pair = current_case[j];
  
          // add pair's total purity
          sum_of_current_case_purities += current_pair.info.purity.average_purity;
          current_case_purities.push(current_pair.info.purity.average_purity);
          // add pair's total probability
          sum_of_current_case_probabilities += current_pair.info.probability.average_probability;
          current_case_probabilities.push(current_pair.info.probability.average_probability);
        }
  
        // calculate current case purity and probability averages
        const current_case_average_purity = sum_of_current_case_purities/current_case_amount_of_pairs;
        const current_case_average_probability = sum_of_current_case_probabilities/current_case_amount_of_pairs;
  
  
        // get sums of purities and probabilites differences of each pair in relation to average
        let sum_of_current_case_purity_differences = 0;
        let sum_of_current_case_probability_differences = 0;
  
        for (let j = 0; j < current_case_amount_of_pairs; j++) {
            const current_pair = current_case[j];
  
            const current_pair_purity_difference = Math.abs(current_pair.info.purity.average_purity - 
                                                            current_case_average_purity);

            const current_pair_probability_difference = Math.abs(current_pair.info.probability.average_probability -
                                                                 current_case_average_probability);
  

            sum_of_current_case_purity_differences += current_pair_purity_difference;
            sum_of_current_case_probability_differences += current_pair_probability_difference;
        }
  
        // calculate current case purity and probability differences averages
        const current_case_average_purity_difference = sum_of_current_case_purity_differences / current_case_amount_of_pairs;
  
        const current_case_average_probability_difference = sum_of_current_case_probability_differences / current_case_amount_of_pairs;
  
  
        // get axies left out of current case
        const current_case_axies_left_out = [];
        for (let j = 0; j < overall_axies.length; j++) {
            const current_axie = overall_axies[j];
            let axie_is_part_of_pair = false;
  
            for (let k = 0; k < current_case_amount_of_pairs; k++) {
                const current_pair = current_case[k];
                const pair_id_one = current_pair.axie_one.id;
                const pair_id_two = current_pair.axie_two.id;
  
                // check if current axie is in current pair, if so, it is not left out of the current case
                if ( (current_axie.id == pair_id_one) || (current_axie.id == pair_id_two) ) {
                    axie_is_part_of_pair = true;
                    break
                }
            }
            // push axie only if it does not appear in any pair in the current case
            if (!axie_is_part_of_pair) {
                current_case_axies_left_out.push(current_axie);
            }
        }
  
        const current_case_info = {
            amount_of_pairs: current_case_amount_of_pairs,
  
            average_purity: current_case_average_purity,
            average_purity_difference: current_case_average_purity_difference,
            purities: current_case_purities,
  
            average_probability: current_case_average_probability,
            average_probability_difference: current_case_average_probability_difference,
            probabilities: current_case_probabilities,
  
            pairs: current_case,
            axies_left_out: current_case_axies_left_out,
        }
        build_cases_with_info.push(current_case_info);

    }

    return build_cases_with_info;
}
//  -------------------------------------------------------------------------------------------------------
  
  
  
  
//  -------------------------------------------------------------------------------------------------------
  
//  Sort cases based on properties
  
//  -------------------------------------------------------------------------------------------------------
  
function get_build_cases_sorted_by(cases_with_info, sorting_properties) {
  
    // check if there are any cases
    if (cases_with_info.length > 0) {
  
      // divide cases of same size (same amount of pairs) in subsets
      const cases_divided_by_length = [ [cases_with_info[0]] ];
      let in_current_length = 0;
  
      for (let i = 1; i < cases_with_info.length; i++) {
          const current_case = cases_with_info[i];
          const first_case_last_subset = cases_divided_by_length[in_current_length][0]
  
          // if current case has the same amount of pairs as the first case added to the last subset of cases,
          // the current case is added to that same subset
          if (current_case.amount_of_pairs == first_case_last_subset.amount_of_pairs) {
              cases_divided_by_length[in_current_length].push(current_case);
  
          // if it has a different amount of pairs, a new subset is created and the current case is pushed there
          } else {
              in_current_length += 1;
              cases_divided_by_length.push( [current_case] );
          }
      }
  
  
      // get cases sorted by sorting properties
      // sorted by amount of pairs overall, but for cases of same size, sorted by sorting properties
  
      const cases_sorted_by_sorting_properties = [];
      for (let i = 0; i < sorting_properties.length; i++) {
  
        const sorting_property = sorting_properties[i];
        const cases_sorted_by_sorting_property = [];
  
        for(let i = 0; i < cases_divided_by_length.length; i++) {
    
            const current_subset = cases_divided_by_length[i];
            const current_subset_sorted_by_sorting_property = quicksort(current_subset, 
                                                                         0, 
                                                                         current_subset.length - 1, 
                                                                         sorting_property);
    
            // since the array containing the subsets is  already sorted by the length of cases of each subset, 
            // after sorting each subset inside by sorting property, cases can be pushed in order
            for (let h = 0; h < current_subset_sorted_by_sorting_property.length; h++) {
              cases_sorted_by_sorting_property.push(current_subset_sorted_by_sorting_property[h]);
            }
        }
  
        const info_current_sorting_property_results = {
          sorting_property: sorting_property,
          cases_sorted: cases_sorted_by_sorting_property
        }
  
        cases_sorted_by_sorting_properties.push(info_current_sorting_property_results)
      }
  
      return cases_sorted_by_sorting_properties;
  
    } else {
        console.log('No cases created');
        return [];
    }
}
  
//  -------------------------------------------------------------------------------------------------------


exports.get_build_cases_with_info = get_build_cases_with_info;
exports.get_build_cases_sorted_by = get_build_cases_sorted_by;