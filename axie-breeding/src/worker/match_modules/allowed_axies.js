const { Axie_Pair } = require('./main_structures');

//  -------------------------------------------------------------------------------------------------------

//  Get allowed axies (by minimum purity) and pairs based on build

//  -------------------------------------------------------------------------------------------------------

function get_axies_based_on_minimum_purity(axies, build) {

    const axies_below_minimum_purity = [];
    const axies_above_minimum_purity = [];
    const parts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];
    
    for (let i = 0; i < axies.length; i++) {
      const axie = axies[i];
      let axie_purity = 100;
      
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
  
        // check dominant genes
        if ( !build.dominant_genes[part].includes(axie.genes[part].d.partId) ) {
          axie_purity = axie_purity - 12.6666666667;
        }
        // check recessive genes
        if ( !build.recessive_genes[part].includes(axie.genes[part].r1.partId) ) {
          axie_purity = axie_purity - 3;
        }
        if ( !build.recessive_genes[part].includes(axie.genes[part].r2.partId) ) {
          axie_purity = axie_purity - 1;
        }
      }


      axie.marketplace_purity = axie_purity;
      if (axie_purity < build.minimum_purity) {
          axies_below_minimum_purity.push(axie);
      } else if (axie_purity >= build.minimum_purity) {
          axies_above_minimum_purity.push(axie);
      }
    }
    
    return {
      axies_below_minimum_purity: axies_below_minimum_purity,
      axies_above_minimum_purity: axies_above_minimum_purity
    }
}
  
//  -------------------------------------------------------------------------------------------------------
  
function create_axie_pairs(axies, build) {
    const axie_pairs = [];
  
    for (let i = 0; i < axies.length; i++) {
      const axie_one = axies[i];
      const sire_one = axie_one.sire_id;
      const matron_one = axie_one.matron_id;
  
      for (let j = i + 1; j < axies.length; j++) {
  
        const axie_two = axies[j];
        const sire_two = axie_two.sire_id;
        const matron_two = axie_two.matron_id;
        if (
          (sire_one != sire_two) &&
          (sire_one != matron_two) &&
          (matron_one != sire_two) &&
          (matron_one != matron_two)
        ) {
          axie_pairs.push(new Axie_Pair(axie_one, axie_two, build));
        }
      }
    }
  
    return axie_pairs;
} 
  
//  -------------------------------------------------------------------------------------------------------
  
function get_build_allowed_pairs(pairs, build) {
  
    const build_allowed_pairs = [];
  
    for (let i = 0; i < pairs.length; i++) {
      const current_pair = pairs[i];
      
      const current_pair_impurities = {
        counters: {
          d: {amount: 0, clashes: 0},
          r1: {amount: 0, clashes: 0},
          r2: {amount: 0, clashes: 0}
        },
        structures: {
          eyes: {d:0, r1:0, r2:0},
          ears: {d:0, r1:0, r2:0},
          mouth: {d:0, r1:0, r2:0},
          horn: {d:0, r1:0, r2:0},
          back: {d:0, r1:0, r2:0},
          tail: {d:0, r1:0, r2:0}
        }
      }
  
      const pair_axies = ['axie_one', 'axie_two'];
      const parts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];
  
      // check impurities, takes into account part id
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
  
        // check impurities for each axie
        for (let k = 0; k < pair_axies.length; k++) {
          const current_axie = pair_axies[k];
  
          // check impurities d
          if ( !build.dominant_genes[part].includes(current_pair[current_axie].genes[part].d.partId) ) {
            current_pair_impurities.counters.d.amount++;
            current_pair_impurities.structures[part].d++;
          }
          // check impurities r1
          if ( !build.recessive_genes[part].includes(current_pair[current_axie].genes[part].r1.partId) ) {
            current_pair_impurities.counters.r1.amount++;
            current_pair_impurities.structures[part].r1++;
          }
          // check impurities r2
          if ( !build.recessive_genes[part].includes(current_pair[current_axie].genes[part].r2.partId) ) {
            current_pair_impurities.counters.r2.amount++;
            current_pair_impurities.structures[part].r2++;
          }
        }
      }
      
      // check clashes
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
  
        // check clashes d
        if (current_pair_impurities.structures[part].d == 2) {
          current_pair_impurities.counters.d.clashes++;
        }
        // check clashes r1
        if (current_pair_impurities.structures[part].r1 == 2) {
          current_pair_impurities.counters.r1.clashes++;
        } 
        // check clashes r2
        if (current_pair_impurities.structures[part].r2 == 2) {
          current_pair_impurities.counters.r2.clashes++;
        }
      }
  

      const type_of_match = `match_by_${build.match_by}`;

      const impurities_structures_allowed = {
        eyes: false,
        ears: false,
        mouth: false,
        horn: false,
        back: false,
        tail: false
      }
  
      // check if impurities fall within build impurities structures
      for (let j = 0; j < build[type_of_match].impurities.structures.length; j++) {
        const current_allowed_structure = build[type_of_match].impurities.structures[j];
  
        for (let k = 0; k < parts.length; k++) {
          const part = parts[k];
  
          if (
            (current_pair_impurities.structures[part].d <= current_allowed_structure.d) && 
            (current_pair_impurities.structures[part].r1 <= current_allowed_structure.r1) && 
            (current_pair_impurities.structures[part].r2 <= current_allowed_structure.r2) 
          ) {
            impurities_structures_allowed[part] = true;
          }
        }
  
        // if all parts already fall within at least one impurities structure, there is no need to keep looking
        if (
          impurities_structures_allowed.eyes && impurities_structures_allowed.ears && 
          impurities_structures_allowed.mouth && impurities_structures_allowed.horn && 
          impurities_structures_allowed.back && impurities_structures_allowed.tail
        ) {
          break;
        }
      }
  
  

      // check type of matching selected 
      if (type_of_match == 'match_by_amount_of_impurities') {

        // match by amount of impurities
        // check if all pair impurities are within the build specifications
        if (
          // check amount of impurities
          (current_pair_impurities.counters.d.amount <= build.match_by_amount_of_impurities.impurities.amounts.d) &&
          (current_pair_impurities.counters.r1.amount <= build.match_by_amount_of_impurities.impurities.amounts.r1) &&
          (current_pair_impurities.counters.r2.amount <= build.match_by_amount_of_impurities.impurities.amounts.r2) &&
          // check amount of clashes
          (current_pair_impurities.counters.d.clashes <= build.match_by_amount_of_impurities.impurities.clashes.d) &&
          (current_pair_impurities.counters.r1.clashes <= build.match_by_amount_of_impurities.impurities.clashes.r1) &&
          (current_pair_impurities.counters.r2.clashes <= build.match_by_amount_of_impurities.impurities.clashes.r2) &&
          // check impurities structures
          impurities_structures_allowed.eyes && impurities_structures_allowed.ears &&
          impurities_structures_allowed.mouth && impurities_structures_allowed.horn &&
          impurities_structures_allowed.back && impurities_structures_allowed.tail
        ) {
          // add impurities info to allowed pairs
          current_pair.info.impurities = {
            amounts: current_pair_impurities,
            structures_allowed: impurities_structures_allowed
          }
          
          // current pair is allowed based on build specifications
          build_allowed_pairs.push(current_pair);

        } else {
          // pair does not fit build specifications
        }


      } else if (type_of_match == 'match_by_minimum_pair_purity') {

        // match my minimum pair purity
        // check if all pair impurities are within the build specifications

        if (
          // check minimum pair purity
          (current_pair.info.marketplace_purity >= build.match_by_minimum_pair_purity.minimum_pair_purity) &&
          // check amount of clashes
          (current_pair_impurities.counters.d.clashes <= build.match_by_minimum_pair_purity.impurities.clashes.d) &&
          (current_pair_impurities.counters.r1.clashes <= build.match_by_minimum_pair_purity.impurities.clashes.r1) &&
          (current_pair_impurities.counters.r2.clashes <= build.match_by_minimum_pair_purity.impurities.clashes.r2) &&
          // check impurities structures
          impurities_structures_allowed.eyes && impurities_structures_allowed.ears &&
          impurities_structures_allowed.mouth && impurities_structures_allowed.horn &&
          impurities_structures_allowed.back && impurities_structures_allowed.tail
        ) {
          // add impurities info to allowed pairs
          current_pair.info.impurities = {
            amounts: current_pair_impurities,
            structures_allowed: impurities_structures_allowed
          }
    
          // current pair is allowed based on build specifications
          build_allowed_pairs.push(current_pair);

        } else {
          // pair does not fit build specifications
        }

      } 
    }
    
    return build_allowed_pairs;
}
  
//  -------------------------------------------------------------------------------------------------------


exports.get_axies_based_on_minimum_purity = get_axies_based_on_minimum_purity;
exports.create_axie_pairs = create_axie_pairs;
exports.get_build_allowed_pairs = get_build_allowed_pairs;