//  -------------------------------------------------------------------------------------------------------

//  Produce cases to be considered based on maximum cases allowed in build

//  -------------------------------------------------------------------------------------------------------

function get_cases_to_be_considered(cases, build) {

    // if total produced cases are greater than or equal to the maximum amount allowed, 
    // we are within our specifications and all cases must be considered
    if (build.results.maximum_cases >= cases.length) {
      return cases;

      // more cases were created than what we are allowing
      // return cases with maximum amount of pairs, until we reach the maximum amount
      // if more cases were created with the maximum amount of pairs, than what we the 
      // amount of cases created, then all of those cases will be considered,
      // even though they will excede the maximum amount allowed
    } else {

      if (cases.length > 0) {
        const cases_to_be_considered = [cases[0]];

        for (let i = 1; i < cases.length; i++) {
          if (cases[i].length == cases_to_be_considered[cases_to_be_considered.length-1].length ) {
            cases_to_be_considered.push(cases[i]);
          } else {
            break;
          }
        }
        
        if (cases_to_be_considered.length >= build.results.maximum_cases) {
          return cases_to_be_considered;
        } else {
          const existing_cases = cases_to_be_considered.length;
          const remaining_cases_to_add = build.results.maximum_cases - existing_cases;
          for (let i = existing_cases; i < remaining_cases_to_add; i++) {
            cases_to_be_considered.push(cases[i]);
          }

          return cases_to_be_considered;
        }
      } else {
        return cases;
      }
    }
}

//  -------------------------------------------------------------------------------------------------------


exports.get_cases_to_be_considered = get_cases_to_be_considered;