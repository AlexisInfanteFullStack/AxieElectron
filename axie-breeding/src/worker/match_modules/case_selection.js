const os = require("os");
const fs = require("fs");
const { get_axie_archetype_key } = require('./create_prices');


//  -------------------------------------------------------------------------------------------------------

//  Automatically select cases

//  -------------------------------------------------------------------------------------------------------

function select_case_automatically(cases_sorted_by_sorting_properties, build, archetypes_keys) {

    let cases_to_select_from;
    // find the cases sorted by the desired sorting property (results.selection.from_result) specified in input_build
    for (let i = 0; i < cases_sorted_by_sorting_properties.length; i++) {
  
      if (cases_sorted_by_sorting_properties[i].sorting_property == build.results.selection.from_result) {
        cases_to_select_from = cases_sorted_by_sorting_properties[i].cases_sorted;
        break;
      }
    }
  
    if (cases_to_select_from == undefined) {
      console.log(`ERROR: Build '${build.name}'`);
      console.log(`Results selection failed, check input in 'results -> selection -> from_result${os.EOL}Valid inputs: ${os.EOL}`);
      console.log(`1) average_probability${os.EOL}2) average_purity`);
      return process.exit(1);
  
    } else {
  
      try {
        const selected_case = cases_to_select_from[build.results.selection.case].pairs;
  
        // only append if selected case has pairs
        if (selected_case.length > 0) {
          // calculate total slp and axs cost of the case
          let case_slp = 0;
          let case_axs = 0;
          for (let i = 0; i < selected_case.length; i++) {
            const current_pair = selected_case[i];
  
            case_slp += current_pair.info.breeds.cost_slp;
            case_axs += current_pair.info.breeds.cost_axs;
          }
  
  
          let selected_case_output_program = '';
          let selected_case_output_user = `File: ./results_user/${build.name}_${build.results.selection.from_result}.json ___ Case: ${build.results.selection.case}${os.EOL}${os.EOL}Total axies: ${Number(selected_case.length*2)} ___ AXS: ${case_axs} ___ SLP: ${case_slp}${os.EOL}${os.EOL}`;
  
          for (let i = 0; i < selected_case.length; i++) {
            const current_pair = selected_case[i];
        
            selected_case_output_program += `${current_pair.axie_one.id},${current_pair.axie_one.ronin},${current_pair.axie_two.id},${current_pair.axie_two.ronin},${current_pair.info.breeds.amount_of_breeds}${os.EOL}`;


            let axie_one_archetype_price,
                axie_two_archetype_price;

            // check if user wants to produce prices
            if (build.produce_prices) {
              // axie_one prices 
              axie_one_archetype_price = String(archetypes_keys[get_axie_archetype_key(current_pair.axie_one)]).slice(0,5);

              // axie_two prices
              axie_two_archetype_price = String(archetypes_keys[get_axie_archetype_key(current_pair.axie_two)]).slice(0,5);

            } else {
              // prices == 0 when user is not interested
              // axie_one prices
              axie_one_archetype_price = 0;

              // axie_two prices
              axie_two_archetype_price = 0;
            }
  
            selected_case_output_user += `id: ${current_pair.axie_one.id} ___ https://marketplace.axieinfinity.com/axie/${current_pair.axie_one.id}/ ___ ronin_name: ${current_pair.axie_one.ronin_name} ___ price: ${axie_one_archetype_price} ___ breed: ${current_pair.info.breeds.amount_of_breeds}${os.EOL}id: ${current_pair.axie_two.id} ___ https://marketplace.axieinfinity.com/axie/${current_pair.axie_two.id}/ ___ ronin_name: ${current_pair.axie_two.ronin_name} ___ price: ${axie_two_archetype_price}${os.EOL}${os.EOL}`;
          }
        
          selected_case_output_user += `--------------------------------------------------------------------------------${os.EOL}${os.EOL}`;
          
          // write selected case of current build
          while (true) {
            try {
  
              // append selected case for user
              fs.appendFileSync('./selected_cases/user.txt', selected_case_output_user);
  
              // If multiple builds are executed simultaneously with automatic selection of cases,
              // it is necessary that the selected case is written synchronous to ensure the axies in that
              // selected case are no longer considered in the subsequent builds
  
              // append selected case for program
              fs.appendFileSync('./selected_cases/program.txt', selected_case_output_program);
  
              console.log(`Build: ${build.name}_${build.results.selection.from_result}.json --- Case: ${build.results.selection.case} --- Selection successful${os.EOL}`);
              break;
  
            } catch (err) {
              console.log(err);
              console.log(`Build: ${build.name}_${build.results.selection.from_result}.json --- Case: ${build.results.selection.case} --- Selection failed${os.EOL}`);
            }
          }
        } else {
          // case does not have any pairs
        }
      } catch (error) {
        console.log(error);
  
        if (error instanceof TypeError) {
          console.log(`ERROR: Case #${build.results.selection.case} does not exist in ./results_user/${build.name}_${build.results.selection.from_result}.json`);
          console.log(`Change input in ./input_build.json`);
        } 
      }
    }
}
  
//  -------------------------------------------------------------------------------------------------------

exports.select_case_automatically = select_case_automatically;