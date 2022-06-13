const os = require("os");
const { AxieGene } = require("agp-npm/dist/axie-gene");

//  -------------------------------------------------------------------------------------------------------

//  Axie and Axie_Pair classes ( main structures used throughout the matching process )

//  -------------------------------------------------------------------------------------------------------

class Axie {

    constructor(id, image, axie_class, name, genes_hex, sire_id, matron_id, breed_count, auction, ronin, ronin_name) {
      this.id = id;
      this.image = image;
      this.class = axie_class;
      this.name = name;
      this.genes_hex = genes_hex;
      this.genes = this.create_genes(genes_hex);
      this.sire_id = sire_id;
      this.matron_id = matron_id;
      this.breed_count = breed_count;
      this.auction = auction;
      this.ronin = ronin;
      this.ronin_name = ronin_name;
    }
  
    create_genes(genes_hexadecimal) {
      const genes_object = new AxieGene(genes_hexadecimal);
      return {
        eyes: genes_object.eyes,
        ears: genes_object.ears,
        mouth: genes_object.mouth,
        horn: genes_object.horn,
        back: genes_object.back,
        tail: genes_object.tail    
      } 
    }
}
  
//  -------------------------------------------------------------------------------------------------------
  
class Axie_Pair {
    constructor(axie_one, axie_two, build) {
      this.axie_one = axie_one;
      this.axie_two = axie_two;
      this.info = this.create_pair_info(axie_one, axie_two, build);
    }
  
    create_pair_info(axie_one, axie_two, build) {
  
      // Calculate pair purity with 37-9-3 parameters
      const parts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];
  
      const pair_parts_purities = {
        eyes: 100,
        ears: 100,
        mouth: 100,
        horn: 100,
        back: 100,
        tail: 100
      }
  
      // check purity
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
  
        // check for d
        if ( !build.dominant_genes[part].includes(axie_one.genes[part].d.partId) ) {
          pair_parts_purities[part] -= 37.5;
        }
        if ( !build.dominant_genes[part].includes(axie_two.genes[part].d.partId) ) {
          pair_parts_purities[part] -= 37.5;
        }   
        // check for r1
        if ( !build.recessive_genes[part].includes(axie_one.genes[part].r1.partId) ) {
          pair_parts_purities[part] -= 9.375;
        }
        if ( !build.recessive_genes[part].includes(axie_two.genes[part].r1.partId) ) {
          pair_parts_purities[part] -= 9.375;
        } 
        // check for r2
        if ( !build.recessive_genes[part].includes(axie_one.genes[part].r2.partId) ) {
          pair_parts_purities[part] -= 3.125;
        }
        if ( !build.recessive_genes[part].includes(axie_two.genes[part].r2.partId) ) {
          pair_parts_purities[part] -= 3.125;
        } 
      }
  
  
      // calculate general purity
      const pair_purity_info = {
        average_purity: (pair_parts_purities.eyes + 
                         pair_parts_purities.ears + 
                         pair_parts_purities.mouth + 
                         pair_parts_purities.horn + 
                         pair_parts_purities.back + 
                         pair_parts_purities.tail)
                         /6,

        parts_purities: pair_parts_purities
      }
  
      // calculate probabilities based on purity values
      const pair_probability_info = {
        average_probability: (pair_parts_purities.eyes/100) *
                             (pair_parts_purities.ears/100) *
                             (pair_parts_purities.mouth/100) *
                             (pair_parts_purities.horn/100) *
                             (pair_parts_purities.back/100) *
                             (pair_parts_purities.tail/100) *
                             100
      }
  
      // calculate amount of breeds
      // check if breeds property is considered in build
      let pair_breeds;
      let pair_breeds_amount;
      if (build.breeds.consider) {
        
        let pair_breeds_parameter_value;

        if (build.breeds.parameter == 'average_purity') {
            pair_breeds_parameter_value = pair_purity_info.average_purity;

        } else if (build.breeds.parameter == 'average_probability') {
            pair_breeds_parameter_value = pair_probability_info.average_probability;

        } else {
            // in future, change so it takes input sync instead of exiting
            console.log(`${os.EOL}ERROR: Invalid input in breeds parameter for build: ${build.name}${os.EOL}`);
            console.log(`Please try again with one of the following options:`);
            console.log(`1) average_purity${os.EOL}2) average_probability`);
            return process.exit(1);
        }
  
        // get the corrent amount of breeds for the current pair based on which range the breeds 
        // parameter is located. If there are intersections between the ranges (intervals), the amount 
        // of breeds of the first range found will be the one used.
        for (let i = 0; i < build.breeds.ranges.length; i++) {
          const current_range = build.breeds.ranges[i];
  
          if (current_range.upper_limit.includes_limit) {
              if (current_range.lower_limit.includes_limit) {
                  if ( 
                    (current_range.upper_limit.value >= pair_breeds_parameter_value) && 
                    (pair_breeds_parameter_value >= current_range.lower_limit.value) 
                    ) {
                          pair_breeds_amount = current_range.amount_of_breeds;
                          break;
                  }
              } else {
                  if ( 
                    (current_range.upper_limit.value >= pair_breeds_parameter_value) && 
                    (pair_breeds_parameter_value > current_range.lower_limit.value) 
                    ) {
                          pair_breeds_amount = current_range.amount_of_breeds;
                          break;
                  }   
              }
          } else {
              if (current_range.lower_limit.includes_limit) {
                  if ( 
                    (current_range.upper_limit.value > pair_breeds_parameter_value) && 
                    (pair_breeds_parameter_value >= current_range.lower_limit.value) 
                    ) {
                          pair_breeds_amount = current_range.amount_of_breeds;
                          break;
                  }
              } else {
                  if ( 
                    (current_range.upper_limit.value > pair_breeds_parameter_value) && 
                    (pair_breeds_parameter_value > current_range.lower_limit.value) 
                    ) {
                          pair_breeds_amount = current_range.amount_of_breeds;
                          break;
                  }   
              }
          }
        }
  
        // calculate slp already used if one or both axies have already been bred
        let axie_one_already_slp = 0;
        let axie_one_new_slp = 0;
        for (let i = 0; i < axie_one.breed_count; i++) {
            axie_one_already_slp += calculate_slp(i);
        }
        for (let i = 0; i < pair_breeds_amount + axie_one.breed_count; i++) {
            axie_one_new_slp += calculate_slp(i);
        }
        const axie_one_total_slp = axie_one_new_slp - axie_one_already_slp;
  
        let axie_two_already_slp = 0;
        let axie_two_new_slp = 0;
        for (let i = 0; i < axie_two.breed_count; i++) {
            axie_two_already_slp += calculate_slp(i);
        }
        for (let i = 0; i < pair_breeds_amount + axie_two.breed_count; i++) {
            axie_two_new_slp += calculate_slp(i);
        }
        const axie_two_total_slp = axie_two_new_slp - axie_two_already_slp;
  
        const pair_total_slp = axie_one_total_slp + axie_two_total_slp;
        // change to take axs cost as parameter
        const pair_total_axs = pair_breeds_amount*0.5;
  
        pair_breeds = {
          amount_of_breeds: pair_breeds_amount,
          cost_axs: pair_total_axs,
          cost_slp: pair_total_slp
        }
        
      } else {
        pair_breeds = {
          amount_of_breeds: 0,
          cost_axs: 0,
          cost_slp: 0
        }
      }
  
      // define order of ids of the pair, lower of the two ids goes first
      // order property will be used when creating keys for cases
      let pair_order;
      if ( Number(axie_one.id) > Number(axie_two.id) ) {
        pair_order = {
          first: 'axie_two',
          second: 'axie_one'
        }
      } else {
        pair_order = {
          first: 'axie_one',
          second: 'axie_two'
        }   
      }

      // calculate pair average marketplace purity ( 12/3/1 rule )
      const pair_marketplace_purity = (axie_one.marketplace_purity + axie_two.marketplace_purity)/2;
      
  
      return {
        purity: pair_purity_info,
        probability: pair_probability_info,
        breeds: pair_breeds,
        order: pair_order,
        marketplace_purity: pair_marketplace_purity
      }
    }
}
  
//  -------------------------------------------------------------------------------------------------------
  
//  Change to take base cases of slp as parameters
  
function calculate_slp(axie_current_breed_count) {
    if (axie_current_breed_count == 0) {
      return 900;
    } else if (axie_current_breed_count == 1) {
      return 1350;
    } else {
      return calculate_slp(axie_current_breed_count-1) + calculate_slp(axie_current_breed_count-2);
    }
}
  
//  -------------------------------------------------------------------------------------------------------


exports.Axie = Axie;
exports.Axie_Pair = Axie_Pair;
exports.calculate_slp = calculate_slp;