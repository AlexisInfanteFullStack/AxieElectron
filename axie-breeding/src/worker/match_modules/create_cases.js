//  -------------------------------------------------------------------------------------------------------

//  Create build cases

//  -------------------------------------------------------------------------------------------------------

function bubble_sort_axies_ocurrences(arr) {
    const n = arr.length;
  
    for (let i = 0; i < n; i++) {
      let already_sorted = true;
  
      for (let j = 0; j < n - i - 1; j++) {
        if (arr[j].ocurrences > arr[j + 1].ocurrences) {
  
          let temp = arr[j];
          arr[j] = arr[j+1];
          arr[j+1] = temp;
          already_sorted = false;
        }
      }
  
      if (already_sorted) {
          break
      }
    }
    return arr;
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_axies_ocurrences(pairs) {
  
    const axies_in_pairs_info = [];
    const axies_in_pairs_ids = [];
  
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
  
      // refactor next two conditionals into loop
      // ocurrences axie_one of current pair
      if ( !axies_in_pairs_ids.includes(pair.axie_one.id) ) {
        axies_in_pairs_info.push( {'id': pair.axie_one.id, 'ocurrences': 1} );
        axies_in_pairs_ids.push(pair.axie_one.id);
      } else {
        for (let j = 0; j < axies_in_pairs_info.length; j++) {
          if ( axies_in_pairs_info[j].id == pair.axie_one.id ) {
             axies_in_pairs_info[j].ocurrences++;
             break;
          }
        }
      }    
  
      // ocurrences axie_two of current pair
      if ( !axies_in_pairs_ids.includes(pair.axie_two.id) ) {
        axies_in_pairs_info.push( {'id': pair.axie_two.id, 'ocurrences': 1} );
        axies_in_pairs_ids.push(pair.axie_two.id);
      } else {
        for (let j = 0; j < axies_in_pairs_info.length; j++) {
          if ( axies_in_pairs_info[j].id == pair.axie_two.id ) {
             axies_in_pairs_info[j].ocurrences++;
             break;
          }
        }
      } 
    }
  
    // sort axies by ocurrences before returning
    return bubble_sort_axies_ocurrences(axies_in_pairs_info);
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_axies_with_least_ocurrences(array_of_ocurrences) {
    
    if (array_of_ocurrences.length > 0) {
      const axies_with_least_ocurrences = [array_of_ocurrences[0]];
  
      for (let i = 1; i < array_of_ocurrences.length; i++) {
        if (array_of_ocurrences[i].ocurrences != axies_with_least_ocurrences[axies_with_least_ocurrences.length-1].ocurrences) {
          break;
        } else {
          axies_with_least_ocurrences.push(array_of_ocurrences[i]);
        }
      }
      return axies_with_least_ocurrences;
  
    } else {
      return [];
    }
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_pairs_of_axies_with_least_ocurrences(pairs, axies_with_least_ocurrences) {
  
    const pairs_of_axies_with_least_ocurrences = [];
  
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
  
      for (let j = 0; j < axies_with_least_ocurrences.length; j++) {
        if ( (pair.axie_one.id == axies_with_least_ocurrences[j].id) || (pair.axie_two.id == axies_with_least_ocurrences[j].id) ) {
          pairs_of_axies_with_least_ocurrences.push(pair);
          break;
        }
      }
    }
    
    return pairs_of_axies_with_least_ocurrences;
}
  
//  -------------------------------------------------------------------------------------------------------
  
function sort_case(current_case) {
  
    // current_case is never an empty array
  
    const n = current_case.length;
  
    // sort case so that pairs with the lowest sum of ids go first
    for (let i = 0; i < n; i++) {
      let already_sorted = true;
  
      for (let j = 0; j < n - i - 1; j++) {
        const sum_j = Number(current_case[j].axie_one.id) + Number(current_case[j].axie_two.id);
        const sum_j_plus_one = Number(current_case[j+1].axie_one.id) + Number(current_case[j+1].axie_two.id);
  
        if (sum_j > sum_j_plus_one) {
  
          let temp = current_case[j];
          current_case[j] = current_case[j+1];
          current_case[j+1] = temp;
          already_sorted = false;
        }
      }
      if (already_sorted) {
          break
      }
    }
  
    let current_case_subsets_by_sum_of_ids = []
    if (n > 0) {
      // divide the pairs of the current case in subsets so that all pairs that have the same combined sum of ids 
      // are together in the same subset. Initialize with a subset containing the first pair of the case, which after sorting previously, 
      // it is known it has the lowest sum of ids
      current_case_subsets_by_sum_of_ids = [ [current_case[0]] ];
      for (let i = 1; i < n; i++) {
  
        const current_pair = current_case[i];
        const current_pair_sum = Number(current_pair.axie_one.id) + Number(current_pair.axie_two.id);
  
        // last pair is not necessarily the last pair added to a subset, rather the first pair added to the last
        // subset created, because all pairs in that subset will have the same sum of ids 
        const last_pair = current_case_subsets_by_sum_of_ids[current_case_subsets_by_sum_of_ids.length-1][0];
        const last_pair_sum = Number(last_pair.axie_one.id) + Number(last_pair.axie_two.id);
  
        
        // if current pair's id sum is different than the sum that pairs have in the last subset, a new subset is created
        // now containing this pair which has a different ids sum
        if ( current_pair_sum != last_pair_sum ) {
          current_case_subsets_by_sum_of_ids.push( [ current_pair ] );
        // if current pair's id sum is the same as the pairs in the last subset, it is just pushed to that subset
        } else {
          current_case_subsets_by_sum_of_ids[current_case_subsets_by_sum_of_ids.length-1].push(current_pair);
        }
      }
  
      // in each subset, all pairs have the same ids sum
      // now sort the subsets based on eachs pair's lowest id
      const current_case_subsets_by_sum_of_ids_length = current_case_subsets_by_sum_of_ids.length;
      for (let i = 0; i < current_case_subsets_by_sum_of_ids_length; i++) {
        const current_subset = current_case_subsets_by_sum_of_ids[i];
  
        const m = current_subset.length;
        for (let j = 0; j < m; j++) {
          let already_sorted = true;
      
          for (let k = 0; k < m - j - 1; k++) {
  
            const pair_k = current_subset[k];
            const pair_k_plus_one = current_subset[k+1];
  
            // check lower id of pairs using the order property, first in order is the axie with the lower id of the pair
            if ( Number(pair_k[pair_k.info.order.first].id) > Number(pair_k_plus_one[pair_k_plus_one.info.order.first].id) ) {
              let temp = pair_k;
              current_subset[k] = pair_k_plus_one;
              current_subset[k+1] = temp;
              already_sorted = false;
            }
          }
      
          if (already_sorted) {
              break
          }
        }      
      }
  
      // create case key
      let current_case_sorted_in_string = '';
      for (let i = 0; i < current_case_subsets_by_sum_of_ids_length; i++) {
        const current_subset = current_case_subsets_by_sum_of_ids[i];
  
        for (let j = 0; j < current_subset.length; j++) {
          const current_pair = current_subset[j];
          const current_pair_first_axie = current_pair[current_pair.info.order.first].id;
          const current_pair_second_axie = current_pair[current_pair.info.order.second].id;
  
          current_case_sorted_in_string += `{${current_pair_first_axie}_${current_pair_second_axie}}`;
        }
      }
  
      return current_case_sorted_in_string;
    }
  
    console.log(`ERROR: sort_case function called with empty array as argument`);
    return process.exit(1);
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_pairs_without_specific_pair_axies(pairs, axie_one_id, axie_two_id) {
  
    const pairs_without_specific_axie_pair_axies = [];
  
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
  
      if ( 
        (pair.axie_one.id == axie_one_id) || (pair.axie_one.id == axie_two_id) ||
        (pair.axie_two.id == axie_one_id) || (pair.axie_two.id == axie_two_id)
      ) {
        // pair contains not desired axies, exclude
      } else {
        pairs_without_specific_axie_pair_axies.push(pair);
      }
    }
  
    return pairs_without_specific_axie_pair_axies;
}
  
//  -------------------------------------------------------------------------------------------------------
  
function get_cases(pairs, current_case, current_build_total_cases, current_build_total_cases_already_created, maximum_timestamp) {
  
    if (pairs.length == 0) {
      // no more pairs available, current case is finished 
      current_build_total_cases.push(current_case);
    
    } else {

      // get current timestamp
      const current_timestamp = Math.floor( Date.now() / 1000 );

      // stop creating cases if final timestamp has been exceeded
      if (current_timestamp > maximum_timestamp) {
        return;
      } 


      const current_axies_ocurrences = get_axies_ocurrences(pairs);
      const current_axies_with_least_ocurrences = get_axies_with_least_ocurrences(current_axies_ocurrences);
      const pairs_of_current_axies_with_least_ocurrences = get_pairs_of_axies_with_least_ocurrences(pairs, current_axies_with_least_ocurrences);
  
      for (let i = 0; i < pairs_of_current_axies_with_least_ocurrences.length; i++) {
  
        const current_pair_containing_axie_with_least_ocurrences = pairs_of_current_axies_with_least_ocurrences[i];
  
        const current_case_plus_current_pair = [ ...current_case, current_pair_containing_axie_with_least_ocurrences ];
        // sort_case is never called with an empty array as the argument
        const current_case_plus_current_pair_key = sort_case(current_case_plus_current_pair);
  
        // check if the current case has already been created
        if (current_build_total_cases_already_created[current_case_plus_current_pair_key] == true) {
            //  current case has already been created, no need to do it again
        
        // create current case key and keep building the current case
        } else if (current_build_total_cases_already_created[current_case_plus_current_pair_key] == undefined) {
          current_build_total_cases_already_created[current_case_plus_current_pair_key] = true;
  
          // delete both axies of the current pair to avoid using them in the future, keeps a maximum of one ocurrence of each axie per case
          const pairs_without_current_pair_axies = get_pairs_without_specific_pair_axies(pairs, 
                                                          current_pair_containing_axie_with_least_ocurrences.axie_one.id, 
                                                          current_pair_containing_axie_with_least_ocurrences.axie_two.id);
  
          get_cases(pairs_without_current_pair_axies, 
                    current_case_plus_current_pair, 
                    current_build_total_cases, 
                    current_build_total_cases_already_created,
                    maximum_timestamp);
        }
      }
    }
}
  
//  -------------------------------------------------------------------------------------------------------


exports.bubble_sort_axies_ocurrences = bubble_sort_axies_ocurrences;
exports.get_axies_ocurrences = get_axies_ocurrences;
exports.get_axies_with_least_ocurrences = get_axies_with_least_ocurrences;
exports.get_pairs_of_axies_with_least_ocurrences = get_pairs_of_axies_with_least_ocurrences;
exports.sort_case = sort_case;
exports.get_pairs_without_specific_pair_axies = get_pairs_without_specific_pair_axies;
exports.get_cases = get_cases;