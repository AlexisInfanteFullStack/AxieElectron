//  -------------------------------------------------------------------------------------------------------

//  Format builds input

//  -------------------------------------------------------------------------------------------------------

function bubble_sort_order_execution(arr) {
    const n = arr.length;
  
    for (let i = 0; i < n; i++) {
  
      let already_sorted = true;
  
      for (let j = 0; j < n - i - 1; j++) {
        if (arr[j].order_of_execution > arr[j + 1].order_of_execution) {
  
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
  
  function format_build(build_file, sorting_algorithm) {
    const build_object = JSON.parse(build_file.replace(/(\r\n|\n|\r)/gm,"{+}").split("{+}").join(''));
    build_object.consider_builds = sorting_algorithm(build_object.consider_builds);
  
    for (let i = 0; i < build_object.builds.length; i++) {
  
      const current_build = build_object.builds[i];
    
      // create address_hex property with ronin address formatted
      for (let j = 0; j < current_build.ronins.length; j++) {
        current_build.ronins[j].address_hex = current_build.ronins[j].address.replace('ronin:', '0x');
      }
    
      // format auction string
      if (current_build.auction == "all") {
        current_build.auction = "All";
      } else if (current_build.auction == "sale") {
        current_build.auction = "Sale";
      } else if (current_build.auction == "not_for_sale") {
        current_build.auction = "NotForSale";
      }
    
      // capitalize classes (if all included then set all classes)
      for (let j = 0; j < current_build.class.length; j++) {
        const current_class = current_build.class[j];
        const current_class_first_letter = current_class.charAt(0);
        const current_class_first_letter_upper_case = current_class_first_letter.toUpperCase();
        const current_class_rest_of_string = current_class.slice(1);
        const current_class_capitalized = current_class_first_letter_upper_case + current_class_rest_of_string;
    
        if (current_class_capitalized == 'All') {
          current_build.class = ['Beast', 'Aquatic', 'Plant', 'Bird', 'Bug', 'Reptile', 'Mech', 'Dawn', 'Dusk'];
          break;
        } else {
          current_build.class[j] = current_class_capitalized;
        }
      }
    

      // format and add part name before each selected gene for dominant_genes / recessive_genes
      const parts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];

        // format dominant genes 
        const part_genes_dominant = current_build.dominant_genes[part];
        for (let k = 0; k < part_genes_dominant.length; k++) {
          const part_gene = part_genes_dominant[k].split('_').join('-');
          part_genes_dominant[k] = `${part}-${part_gene}`;
        }
        current_build.dominant_genes[part] = part_genes_dominant;

        // format recessive genes 
        const part_genes_recessive = current_build.recessive_genes[part]
        for (let k = 0; k < part_genes_recessive.length; k++) {
          const part_gene = part_genes_recessive[k].split('_').join('-');
          part_genes_recessive[k] = `${part}-${part_gene}`;
        }
        current_build.recessive_genes[part] = part_genes_recessive;
      }
    

    
      // format match_by_amount_of_impurities structures
      for (let k = 0; k < current_build.match_by_amount_of_impurities.impurities.structures.length; k++) {
        const structure = current_build.match_by_amount_of_impurities.impurities.structures[k].split('_');
        let d = 0,
            r1 = 0,
            r2 = 0;
    
        for (let l = 0; l < structure.length; l++) {
          if (structure[l] == 'd') {d++}
          else if (structure[l] == 'r1') {r1++}
          else if (structure[l] == 'r2') {r2++} 
        }
        current_build.match_by_amount_of_impurities.impurities.structures[k] = {d: d, r1: r1, r2: r2}
      }

      // format match_by_minimum_pair_purity structures
      for (let k = 0; k < current_build.match_by_minimum_pair_purity.impurities.structures.length; k++) {
        const structure = current_build.match_by_minimum_pair_purity.impurities.structures[k].split('_');
        let d = 0,
            r1 = 0,
            r2 = 0;
    
        for (let l = 0; l < structure.length; l++) {
          if (structure[l] == 'd') {d++}
          else if (structure[l] == 'r1') {r1++}
          else if (structure[l] == 'r2') {r2++} 
        }
        current_build.match_by_minimum_pair_purity.impurities.structures[k] = {d: d, r1: r1, r2: r2}
      }
      

  
      
      // create ronin/name key value pairs
      current_build.ronins_names = {};
      for (let j = 0; j < current_build.ronins.length; j++) {
        const ronin = current_build.ronins[j];
  
        // create key/value pair with hex address instead of ronin: format, that way it is easier to get the
        // value when creating each axie object
        current_build.ronins_names[ronin.address_hex] = ronin.name;
      }
    }
  
    return build_object;
  }
  
//  -------------------------------------------------------------------------------------------------------


exports.bubble_sort_order_execution = bubble_sort_order_execution;
exports.format_build = format_build;