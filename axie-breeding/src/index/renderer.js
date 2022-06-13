"use strict"

const { ipcRenderer } = require('electron');




// change to the specific id of each build every time the createBuild function is called
// will be used to remove build from DOM when build is removed from selected builds or
// completely deleted from localStorage
let lastLoadedBuildId = '';

// change to the specific result id every time loadBuilResultScreen function is called
let lastLoadedResultId = '';


// ----------------------------------------------------------------------
//  load available builds after DOM loaded 

window.addEventListener('DOMContentLoaded', function() {
  updateAvailableBuilds();
});


// ----------------------------------------------------------------------
// check if selected cases exists
// if not, create empty array of selected cases

const selectedCasesInStorage = localStorage.getItem('selectedCases');

if (!selectedCasesInStorage) {
  localStorage.setItem('selectedCases', JSON.stringify( [] ));
}






// ----------------------------------------------------------------------
// update builds list

function updateAvailableBuilds() {

  const availableBuildsIds = Object.keys(localStorage);
  const availableBuildsNames = [];

  for (let i = 0; i < availableBuildsIds.length; i++) {
    const buildId = availableBuildsIds[i];

    // localStorage also contains selectedCases key
    // check that build id is not that key
    if (buildId != 'selectedCases') {

      const buildObj = JSON.parse(window.localStorage.getItem(buildId));
      availableBuildsNames.push(`${buildObj.name}{separator}${buildObj.id}`);      
    }

  }

  const availableBuilds = bubbleSortWords(availableBuildsNames);


  const selectBuildsInput = document.querySelector('#select-builds-input');

  const defaultBuildOption = `<option value="default">Select Builds</option>`;
  selectBuildsInput.innerHTML = defaultBuildOption;

  // show builds names in select options
  for (let i = 0; i < availableBuilds.length; i++) {
      const buildNameId = availableBuilds[i];

      const buildName = buildNameId.split('{separator}')[0];
      const buildId = buildNameId.split('{separator}')[1];

      selectBuildsInput.innerHTML += `<option value="${buildId}">${buildName}</option>`;
  }
}



// ----------------------------------------------------------------------
// select builds 

const selectedBuildsIds = [];
const selectedBuildsWithOrderElement = [];

const selectedBuildsContainer = document.querySelector('#selected-builds');


const selectBuildsInput = document.querySelector('#select-builds-input');


selectBuildsInput.addEventListener('click', function() {

    const selectedBuildId = selectBuildsInput.value;

    // check that selected build is not default value
    if (selectedBuildId != 'default' && !selectedBuildsIds.includes(selectedBuildId)) {
      
      // add build to selected builds array
      selectedBuildsIds.push(selectedBuildId);

      // add build to DOM
      const buildContainer = document.createElement('div');
      buildContainer.classList.add('build');
      buildContainer.id = `build-${selectedBuildId}`;

      // get selected build name
      const selectedBuildObj = JSON.parse(window.localStorage.getItem(selectedBuildId));

      const buildContent = `
        <button class="remove-build-btn">x</button>

        <span class="build-name">${selectedBuildObj.name}</span>
        
        <div class="interact-with-build">
            <input type="text" class="selected-build-order" placeholder="Order">
            <!-- delete build from localStorage -->
            <button class="delete-build-btn">Delete</button>
            <button class="update-build-btn">Update</button>
        </div>

        <div class="build-results">
          <span>Results</span>      
        </div>
      `;

      buildContainer.insertAdjacentHTML('afterbegin', buildContent);



      // build results 
      const buildResultsContainer = buildContainer.querySelector('.build-results');
      const buildResultsCreated = getBuildResultsCreated(selectedBuildId);

      for (let i = 0; i < buildResultsCreated.length; i++) {
        const result = buildResultsCreated[i];        

        const resultDate = new Date(Number(result.id.slice(2)))
        const resultDateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
        const resultDateFormatted = resultDate.toLocaleString('en-US', resultDateOptions);

        const buildResultContainer = document.createElement('div');
        buildResultContainer.classList.add('build-result');

        const buildResultContainerContent = `
          <span class="result-title">Average ${result.type}</span>
          <div>
            <span>${result.id}</span>
            <span>${resultDateFormatted}</span>
          </div>
          <button class="delete-build-result">x</button>
        `;

        buildResultContainer.insertAdjacentHTML('afterbegin', buildResultContainerContent);
        buildResultsContainer.appendChild(buildResultContainer);
        
        // delete build result btn
        const deleteBuildResultBtn = buildResultContainer.querySelector('.delete-build-result');
        deleteBuildResultBtn.addEventListener('dblclick', function() {

          const buildResultsCreatedCurrently = getBuildResultsCreated(selectedBuildId);
          let resultToBeDeletedIndex = -1;
          for (let j = 0; j < buildResultsCreatedCurrently.length; j++) {
            const currentResult = buildResultsCreatedCurrently[j];

            if (currentResult.id == result.id && currentResult.type == result.type) {
              resultToBeDeletedIndex = i;
              break;
            }
          }

          // delete from array
          if (resultToBeDeletedIndex > -1) {
            buildResultsCreatedCurrently.splice(resultToBeDeletedIndex, 1);
          }

          // change results created in local storage for new array with deleted result
          const buildInfo = JSON.parse(window.localStorage.getItem(selectedBuildId));
          buildInfo.results_created = buildResultsCreatedCurrently;

          window.localStorage.setItem(selectedBuildId, JSON.stringify(buildInfo));

          // remove from DOM
          buildResultContainer.remove();

          // remove build result screen from DOM if it's of result just deleted
          const alreadyLoadedBuildResult = document.querySelector('#build-result-screen');
          if (alreadyLoadedBuildResult && lastLoadedResultId == result.id) {
              alreadyLoadedBuildResult.remove();
          }



        });

        deleteBuildResultBtn.addEventListener('click', function(e) {
          e.stopPropagation();
        });


        // open build result btn
        buildResultContainer.addEventListener('click', function() {

          loadBuildResultScreen(selectedBuildObj, result.id)
        });

      }

    

      // build order element
      const buildOrderElement = buildContainer.querySelector('.selected-build-order');
      // store build order element and selected build id together so we can get current orders when
      // match button gets triggered
      selectedBuildsWithOrderElement.push( {buildId: selectedBuildId, orderElement: buildOrderElement} )



      // remove build btn
      const removeBuildBtn = buildContainer.querySelector('.remove-build-btn');
      removeBuildBtn.addEventListener('click', function() {

        // remove build from selected builds ids array
        const selectedBuildIdIndex = selectedBuildsIds.indexOf(selectedBuildId);
        if (selectedBuildIdIndex > -1) {
          selectedBuildsIds.splice(selectedBuildIdIndex, 1);
        }


        // remove build from selected builds with order element array
        let selectedBuildIndexInWithOrderElement = -1;
        for (let i = 0; i < selectedBuildsWithOrderElement.length; i++) {
          const selectedBuildWithOrderElement = selectedBuildsWithOrderElement[i];

          if (selectedBuildWithOrderElement.buildId == selectedBuildId) {
            selectedBuildIndexInWithOrderElement = i;
            break;
          } 
        }

        if (selectedBuildIndexInWithOrderElement > -1) {
          selectedBuildsWithOrderElement.splice(selectedBuildIndexInWithOrderElement, 1);
        }


        // remove build from DOM
        buildContainer.remove();

        // remove build updating screen from DOM if last loaded
        if (lastLoadedBuildId == selectedBuildId) {
          // remove build from DOM if it's currently loaded 
          const alreadyLoadedBuild = document.querySelector('#create-build-process-container');
          if (alreadyLoadedBuild) {
              alreadyLoadedBuild.remove();
          }
        }
        
      });


      // delete build btn
      const deleteBuildBtn = buildContainer.querySelector('.delete-build-btn');
      deleteBuildBtn.addEventListener('dblclick', function() {

        // remove build from selected builds and trigger 
        removeBuildBtn.click();

        // delete build from local storage
        window.localStorage.removeItem(selectedBuildId);

        // update available builds
        updateAvailableBuilds();
      });


      // update btn
      const updateBuildBtn = buildContainer.querySelector('.update-build-btn');
      updateBuildBtn.addEventListener('click', function() {

        const buildToBeUpdated = window.localStorage.getItem(selectedBuildId);

        createBuild(defaultBuildHTML, JSON.parse(buildToBeUpdated));
      });


      selectedBuildsContainer.appendChild(buildContainer);
    }



    selectBuildsInput.value = 'default';
});







// ----------------------------------------------------------------------
// execute buttons toggle

const matchBtnEl = document.querySelector('#match-btn');
const stopBtnEl = document.querySelector('#stop-btn');

// match button
matchBtnEl.addEventListener('click', function() {
  // hide match button
  matchBtnEl.style.display = 'none';
  // display stop button
  stopBtnEl.style.display = 'block';


  const selectedBuildsObjs = [];
  for (let i = 0; i < selectedBuildsWithOrderElement.length; i++) {
    const selectedBuild = selectedBuildsWithOrderElement[i];
    
    selectedBuildsObjs.push( {buildId: selectedBuild.buildId, order: Number(selectedBuild.orderElement.value)} )
  }

  insertionSortOrder(selectedBuildsObjs);


  
  // format builds
  const finalFormattedBuilds = [];

  for (let i = 0; i < selectedBuildsObjs.length; i++) {
    const selectedBuildObj = selectedBuildsObjs[i];
    
    const selectedBuild = JSON.parse(window.localStorage.getItem(selectedBuildObj.buildId));


    finalFormattedBuilds.push(getFormattedBuildForExecution( selectedBuild ));
  }


  // builds ready for matching
  // console.log(finalFormattedBuilds);

  // selected cases to check axies are not repeated
  const currentSelectedCases = getSelectedCases();


  // start matching process
  // send formatted builds and current selected cases
  const buildsToBeMatchedInfo = electronMatchBuilds( {builds: finalFormattedBuilds, selectedCases: currentSelectedCases} );



  buildsToBeMatchedInfo.then( function (result) {
    console.log(result); 
  });


});




function getFormattedBuildForExecution(buildObj) {

  for (let i = 0; i < buildObj.ronins.length; i++) {

  // consider all ronins 
    buildObj.ronins[i].consider = true;

  // add address_hex to ronins
    buildObj.ronins[i].address_hex = buildObj.ronins[i].address.replace('ronin:', '0x');
  }


  // format auction string
  if (buildObj.auction == "all") {
    buildObj.auction = "All";
  } else if (buildObj.auction == "sale") {
    buildObj.auction = "Sale";
  } else if (buildObj.auction == "not_for_sale") {
    buildObj.auction = "NotForSale";
  }


  // capitalize classes
  for (let j = 0; j < buildObj.class.length; j++) {
    const current_class = buildObj.class[j];
    const current_class_first_letter = current_class.charAt(0);
    const current_class_first_letter_upper_case = current_class_first_letter.toUpperCase();
    const current_class_rest_of_string = current_class.slice(1);
    const current_class_capitalized = current_class_first_letter_upper_case + current_class_rest_of_string;

    buildObj.class[j] = current_class_capitalized;
  }


  
  // create separate dominant and recessive genes properties
  buildObj.dominant_genes = JSON.parse(JSON.stringify(buildObj.genes.dominant));
  buildObj.recessive_genes = JSON.parse(JSON.stringify(buildObj.genes.recessive));


  // format genes (dominant / recessive)

  const bodyParts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];
  for (let i = 0; i < bodyParts.length; i++) {
    const bodyPart = bodyParts[i];

    // format dominant genes
    for (let j = 0; j < buildObj.dominant_genes[bodyPart].length; j++) {
      const bodyPartDominantGene = buildObj.dominant_genes[bodyPart][j];

      buildObj.dominant_genes[bodyPart][j] = `${bodyPart}-${getGeneFormatted(bodyPartDominantGene)}`;
    }
    
    // format recessive genes
    for (let j = 0; j < buildObj.recessive_genes[bodyPart].length; j++) {
      const bodyPartRecessiveGene = buildObj.recessive_genes[bodyPart][j];
      
      buildObj.recessive_genes[bodyPart][j] = `${bodyPart}-${getGeneFormatted(bodyPartRecessiveGene)}`;;
    }
  }


  // create separate match by settings depending on type of match
  buildObj.match_by_amount_of_impurities = {
    impurities: buildObj.match_by_settings.impurities
  }

  buildObj.match_by_minimum_pair_purity = {
    minimum_pair_purity: buildObj.match_by_settings.minimum_pair_purity,

    impurities: {
      clashes: buildObj.match_by_settings.impurities.clashes,
      structures: buildObj.match_by_settings.impurities.structures
    }
  }


  // create ronin/name key value pairs
  buildObj.ronins_names = {};

  for (let j = 0; j < buildObj.ronins.length; j++) {
    const ronin = buildObj.ronins[j];

    // create key/value pair with hex address instead of ronin: format, that way it is easier to get the
    // value when creating each axie object
    buildObj.ronins_names[ronin.address_hex] = ronin.name;
  }


  return buildObj;
}





// stop button 


stopBtnEl.addEventListener('click', function() {
    // hide stop button
    stopBtnEl.style.display = 'none';
    // display match button
    matchBtnEl.style.display = 'block';


    // cancel matching process
    const unmatchBuidlsNotice = electronUnmatchBuilds();

    unmatchBuidlsNotice.then( function (result) {
      console.log(result); 
    });


});













// ----------------------------------------------------------------------
// toggle sidebar 

let sidebarIsCollapsed = false;

const toggleSidebarBtn = document.querySelector('#toggle-sidebar-btn');
toggleSidebarBtn.addEventListener('click', function() {

  const sidebar = document.querySelector('#sidebar');
  const executeContainer = document.querySelector('#execute-container');
  const mainMenu = document.querySelector('#main-menu');
  const showcase = document.querySelector('#showcase');
  const headerContainer = document.querySelector('#header-container');

  if (!sidebarIsCollapsed) {

    for (let i = 1; i < sidebar.children.length; i++) {
      const sidebarElement = sidebar.children[i];
      sidebarElement.style.display = 'none';
    }
  
    executeContainer.style.display = 'none';
    mainMenu.style.flexBasis = '5%';
    showcase.style.flexBasis = '95%';
    headerContainer.style.display = 'block';

    // update sidebar state
    sidebarIsCollapsed = true;

  } else {

    for (let i = 1; i < sidebar.children.length; i++) {
      const sidebarElement = sidebar.children[i];
      sidebarElement.style.display = 'block';
    }
  
    executeContainer.style.display = 'block';
    mainMenu.style.flexBasis = '35%';
    showcase.style.flexBasis = '65%';
    headerContainer.style.display = 'flex';

    // update sidebar state
    sidebarIsCollapsed = false;
  }
});




// ----------------------------------------------------------------------
// open selected cases 

const selectedCasesBtn = document.querySelector('#selected-cases-btn');
selectedCasesBtn.addEventListener('click', function() {

  loadSelectedCasesScreen();

});





// ----------------------------------------------------------------------
// load build results screen

function loadBuildResultScreen(build, resultId) {

  lastLoadedResultId = resultId;

  clearShowcase();

  // get result object from build
  let result;
  for (let i = 0; i < build.results_created.length; i++) {
    const currentResult = build.results_created[i];

    if (resultId == currentResult.id) {
      result = currentResult;
      break;
    }
  }

  const resultDate = new Date(Number(result.id.slice(2)))
  const resultDateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const resultDateFormatted = resultDate.toLocaleString('en-US', resultDateOptions);



  let resultAxiesDiscarded = '';
  for (let i = 0; i < result.results.axies_discarded.length; i++) {
    const axieDiscarded = result.results.axies_discarded[i];

    const axieDiscardedHTML = `
    <div class="axie-discarded mg-top">
      <span>${axieDiscarded.id}</span>
      <span>${axieDiscarded.ronin_name}</span>
      <a href="https://marketplace.axieinfinity.com/axie/${axieDiscarded.id}/" target="_blank" class="market-link"><i class="fa-solid fa-tag"></i></a>
    </div>
    `;

    resultAxiesDiscarded += axieDiscardedHTML;
  }

  const resultCasesContainer = document.createElement('div'); 
  resultCasesContainer.id = 'cases-container';
  resultCasesContainer.classList.add('mg-top');

  for (let i = 0; i < result.results.cases.length; i++) {
    const currentCase = result.results.cases[i];

    let currentCasePairs = '';
    for (let j = 0; j < currentCase.pairs.length; j++) {
      const currentPair = currentCase.pairs[j];
      
      const currentPairHTML = `
      <div class="case-pair">
        <div class="case-pair-amount-of-breeds">
          <span>${currentPair.amount_of_breeds}</span>
        </div>
        <div class="case-pair-axies">
          <div>
            <span>${currentPair.axie_one.id}</span>
            <span>${currentPair.axie_one.ronin_name}</span>
            <span>${currentPair.axie_one.price} <span class="eth">ETH</span></span>
            <a href="https://marketplace.axieinfinity.com/axie/${currentPair.axie_one.id}/" target="_blank" class="market-link"><i class="fa-solid fa-tag"></i></a>
          </div>
          <div>
            <span>${currentPair.axie_two.id}</span>
            <span>${currentPair.axie_two.ronin_name}</span>
            <span>${currentPair.axie_two.price} <span class="eth">ETH</span></span>
            <a href="https://marketplace.axieinfinity.com/axie/${currentPair.axie_two.id}/" target="_blank" class="market-link"><i class="fa-solid fa-tag"></i></a>
          </div>
        </div>
      </div>       
      `;

      currentCasePairs += currentPairHTML;
    }

    let currentCaseAxiesLeftOut = '';
    for (let j = 0; j < currentCase.axies_left_out.length; j++) {
      const currentAxieLeftOut = currentCase.axies_left_out[j];

      const currentAxieLeftOutHTML = `
      <div class="axie-left-out">
        <span>${currentAxieLeftOut.id}</span>
        <span>${currentAxieLeftOut.ronin_name}</span>
        <a href="https://marketplace.axieinfinity.com/axie/${currentAxieLeftOut.id}/" target="_blank" class="market-link"><i class="fa-solid fa-tag"></i></a>
      </div>
      `;

      currentCaseAxiesLeftOut += currentAxieLeftOutHTML;
    }


    const currentCaseContainer = document.createElement('div');
    currentCaseContainer.classList.add('case');

    // select current case btn
    const selectCurrentCaseBtn = document.createElement('button');
    selectCurrentCaseBtn.classList.add('select-case');
    selectCurrentCaseBtn.textContent = 'Select';

    selectCurrentCaseBtn.addEventListener('click', function() {
      selectCurrentCaseBtn.style.background = 'linear-gradient(to right, #EB3349 0%, #fb4b30 51%, #EB3349 100%)';




      const selectedCaseObj = {
        result_id: result.id,
        result_type: result.type,
        build_name: build.name,
        case: {
          case_number: String(i),
          amount_of_pairs: currentCase.amount_of_pairs,
          average_probability: currentCase.average_probability,
          average_probability_difference: currentCase.average_probability_difference,
          average_purity: currentCase.average_purity,
          average_purity_difference: currentCase.average_purity_difference,
    
          axs: currentCase.axs,
          slp: currentCase.slp,
    
          pairs: currentCase.pairs
        }
    
      }

      // check if selected case is not already in selected cases
      let caseHasAlreadyBeenSelected = false;

      const selectedCases = getSelectedCases();
      

      for (let j = 0; j < selectedCases.length; j++) {
        const selectedCase = selectedCases[j];

        if ( 
          (selectedCase.result_id == selectedCaseObj.result_id) &&
          (selectedCase.result_type == selectedCaseObj.result_type) && 
          (selectedCase.case.case_number == selectedCaseObj.case.case_number)
          ) {
          caseHasAlreadyBeenSelected = true;
        }
        
      }

      if (!caseHasAlreadyBeenSelected) {
        addSelectedCase(selectedCaseObj);
      }

    });





    // add select button to case container
    currentCaseContainer.appendChild(selectCurrentCaseBtn);

    // add case info to case container
    const currentCaseInfo = `
    <div class="case-info">
      <span>Case #${i}</span>
      <span>Amount of Pairs: ${currentCase.amount_of_pairs}</span>
      <div class="mg-top">
        <span>Average Probability: ${currentCase.average_probability}</span>
        <span>Average Probability Difference: ${currentCase.average_probability_difference}</span>
      </div>
      <div class="mg-top">
        <span>Average Purity: ${currentCase.average_purity}</span>
        <span>Average Purity Difference: ${currentCase.average_purity_difference}</span>
      </div>
      <div class="mg-top">
        <span>AXS: ${currentCase.axs}</span>
        <span>SLP: ${currentCase.slp}</span>
      </div>
      <span class="mg-top">Pairs:</span>

      <div class="case-pairs">
        ${currentCasePairs}
      </div>

      <span class="mg-top-1">Axies Left Out:</span>

      <div class="case-axies-left-out">
        ${currentCaseAxiesLeftOut}
      </div>
    
    </div>
    `
    currentCaseContainer.insertAdjacentHTML('beforeend', currentCaseInfo);

    // add current case to cases container
    resultCasesContainer.appendChild(currentCaseContainer);

  }



  const buildResultContainer = document.createElement('div');
  buildResultContainer.id = 'build-result-screen';

  const buildResultContainerContent = `
  <div id="build-name-container">
    <span id="build-name">${build.name}</span>
    <button id="close-build-result">X</button>
  </div>

  <div id="build-result-info">

    <div id="result-type-id-container">
      <span id="result-type">Average ${result.type}</span>
      <span id="result-id">${result.id}</span>
    </div>
    <div id="result-date-container" class="mg-top">
      <span id="result-date">${resultDateFormatted}</span>
    </div>

    <span id="minimum-purity" class="mg-top">Minimum Purity: ${result.results.minimum_purity}</span>

    <div class="mg-top">
      <span>Axies Discarded:</span>
    </div>

    <div id="axies-discarded-container">
      ${resultAxiesDiscarded}
    </div>

    <div class="mg-top-1">
      <span>Cases:</span>
    </div>

    <!-- add cases container -->
    
  </div>
  `;

  buildResultContainer.insertAdjacentHTML('beforeend', buildResultContainerContent);

  const buildResultInfoContainer = buildResultContainer.querySelector('#build-result-info');
  // add cases container element
  buildResultInfoContainer.appendChild(resultCasesContainer);



  const showcase = document.querySelector('#showcase');
  // add build result to showcase
  showcase.appendChild(buildResultContainer);



  // close build btn
  const closeBuildResultBtn = showcase.querySelector('#close-build-result');
  closeBuildResultBtn.addEventListener('click', function(e) {
      
      // remove build result that has already been loaded as html
      const alreadyLoadedBuildResult = showcase.querySelector('#build-result-screen');
      if (alreadyLoadedBuildResult) {
          alreadyLoadedBuildResult.remove();
      }
  });


}
 



// ----------------------------------------------------------------------
// load selected cases

function loadSelectedCasesScreen() {

  clearShowcase();

  const selectedCases = getSelectedCases();

  // const selectedCases = [...selectedCasesTest];



  const selectedCasesScreen = document.createElement('div');
  selectedCasesScreen.id = 'selected-cases-screen';
  
  const selectedCasesHeader = document.createElement('div');
  selectedCasesHeader.id = 'selected-cases-header';
  selectedCasesHeader.innerHTML = '<span>Selected Cases</span>';

  const closeSelectedCasesScreenBtn = document.createElement('button');
  closeSelectedCasesScreenBtn.textContent = 'X';
  closeSelectedCasesScreenBtn.id = 'close-selected-cases-screen'

  closeSelectedCasesScreenBtn.addEventListener('click', function() {
    selectedCasesScreen.remove();
  });

  selectedCasesHeader.appendChild(closeSelectedCasesScreenBtn);
  selectedCasesScreen.appendChild(selectedCasesHeader);


  // up to selected cases header done


  const selectedCasesContainer = document.createElement('div');
  selectedCasesContainer.id = 'selected-cases';


  for (let i = 0; i < selectedCases.length; i++) {
    const selectedCaseObj = selectedCases[i];

    const selectedCase = document.createElement('div');
    selectedCase.classList.add('selected-case');

    const deleteSelectedCaseBtn = document.createElement('button');
    deleteSelectedCaseBtn.classList.add('delete-selected-case');
    deleteSelectedCaseBtn.textContent = 'Delete';

    deleteSelectedCaseBtn.addEventListener('dblclick', function() {
      // delete from DOM
      selectedCase.remove();
      // delete from localStorage
      deleteSelectedCase(selectedCaseObj);
    });

    selectedCase.appendChild(deleteSelectedCaseBtn);


    const selectedCaseDate = new Date(Number(selectedCaseObj.result_id.slice(2)))
    const selectedCaseDateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    const selectedCaseDateFormatted = selectedCaseDate.toLocaleString('en-US', selectedCaseDateOptions);



    let selectedCasePairs = '';
    for (let j = 0; j < selectedCaseObj.case.pairs.length; j++) {
      const currentPair = selectedCaseObj.case.pairs[j];
      
      const currentPairHTML = `
      <div class="case-pair">
        <div class="case-pair-amount-of-breeds">
          <span>${currentPair.amount_of_breeds}</span>
        </div>
        <div class="case-pair-axies">
          <div>
            <span>${currentPair.axie_one.id}</span>
            <span>${currentPair.axie_one.ronin_name}</span>
            <span>${currentPair.axie_one.price} <span class="eth">ETH</span></span>
            <a href="https://marketplace.axieinfinity.com/axie/${currentPair.axie_one.id}/" target="_blank" class="market-link"><i class="fa-solid fa-tag"></i></a>
          </div>
          <div>
            <span>${currentPair.axie_two.id}</span>
            <span>${currentPair.axie_two.ronin_name}</span>
            <span>${currentPair.axie_two.price} <span class="eth">ETH</span></span>
            <a href="https://marketplace.axieinfinity.com/axie/${currentPair.axie_two.id}/" target="_blank" class="market-link"><i class="fa-solid fa-tag"></i></a>
          </div>
        </div>
      </div>        
      `;

      selectedCasePairs += currentPairHTML;
    }



    const selectedCaseInfo = `
    
    <span>Build: <strong>${selectedCaseObj.build_name}</strong></span>

    <span class="mg-top">Result: Average ${selectedCaseObj.result_type}</span>
    <span>Id: ${selectedCaseObj.result_id}</span>

    <span class="mg-top">${selectedCaseDateFormatted}</span>

    <div class="case">

      <div class="case-info">
        <span>Case #${selectedCaseObj.case.case_number}</span>
        <span>Amount of Pairs: ${selectedCaseObj.case.amount_of_pairs}</span>
        <div class="mg-top">
          <span>Average Probability: ${selectedCaseObj.case.average_probability}</span>
          <span>Average Probability Difference: ${selectedCaseObj.case.average_probability_difference}</span>
        </div>
        <div class="mg-top">
          <span>Average Purity: ${selectedCaseObj.case.average_purity}</span>
          <span>Average Purity Difference: ${selectedCaseObj.case.average_purity_difference}</span>
        </div>
        <div class="mg-top">
          <span>AXS: ${selectedCaseObj.case.axs}</span>
          <span>SLP: ${selectedCaseObj.case.slp}</span>
        </div>
        <span class="mg-top">Pairs:</span>

        <div class="case-pairs">
          
          ${selectedCasePairs}
          
        </div>
  
      </div>
    </div>
    `;

    selectedCase.insertAdjacentHTML('beforeend', selectedCaseInfo);


    selectedCasesContainer.appendChild(selectedCase);
  }


  selectedCasesScreen.appendChild(selectedCasesContainer);

  const showcase = document.querySelector('#showcase');
  showcase.appendChild(selectedCasesScreen);

}




// ----------------------------------------------------------------------
// create build

const defaultBuildHTML = `
<!-- show build -->
<div id="create-build-process-container">

  <!-- name -->
  <div class="input-group">
    <label class="build-title aside">Name:</label>
    <input type="text" name="name" id="name">
  </div>

  <!-- ronins -->
  <div class="input-group">
    <label class="build-title header">Ronins</label>

    <!-- add ronins -->
    <div class="ronin-entry-container">
      <div class="ronin-btn-container">
        <button id="add-ronin-btn">+</button>
      </div>
      <div class="ronin-info-container">
        <div>
          <label for="ronin-address">Address:</label>
          <input type="text" name="ronin-address" id="ronin-address">
        </div> 
        <div>
          <label for="ronin-name">Name:</label>
          <input type="text" name="ronin-name" id="ronin-name">
        </div>
      </div>
    </div>

    <!-- added ronins container -->
    <div id="added-ronins">

      <!-- ronin entry example -->
      <!-- 
      <div class="ronin-entry-container">
        <div class="ronin-btn-container">
          <button class="delete-ronin-btn">x</button>
        </div>
        <div class="ronin-info-container">
          <div>
            <label>Address:</label>
            <input type="text">
          </div> 
          <div>
            <label>Name:</label>
            <input type="text">
          </div>
        </div>
      </div>
      -->
    </div>

  </div>


  <!-- results -->
  <div class="input-group">
    <label class="build-title header">Results</label>

    <div id="maximum-cases-container">
      <label for="maximum-cases">Maximum Cases:</label>
      <input type="text" name="maximum-cases" id="maximum-cases">
    </div>

    <div id="results-options-container">
      <div class="type-of-result-container">
        <input type="checkbox" name="average-probability" id="average-probability">
        <label for="average-probability">Average Probability</label>
      </div>
      <div class="type-of-result-container">
        <input type="checkbox" name="average-purity" id="average-purity">
        <label for="average-purity">Average Purity</label>
      </div>

    </div>

    <div id="automatic-selection-container">
      <label for="automatic-selection">Automatic Selection</label>
      <input type="checkbox" name="automatic-selection" id="automatic-selection">

      <div>
        <!-- case selected -->
        <div>
          <label for="case-selected">Case</label>
          <input type="text" name="case-selected" id="case-selected">
        </div>
        <!-- from result -->
        <div>
          <label for="from-result">From</label>
          <select name="from-result" id="from-result">
            <option value="average_probability">Average Probability</option>
            <option value="average_purity">Average Purity</option>
          </select>
        </div>
      </div> 

    </div>

  </div>


  <!-- breed counts -->
  <div class="input-group" id="breed-count-input">
    <label class="build-title aside">Breed Counts:</label>
    <div id="breed-count-options">

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-0">
        <label for="breed-counts-0">0</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-1">
        <label for="breed-counts-1">1</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-2">
        <label for="breed-counts-2">2</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-3">
        <label for="breed-counts-3">3</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-4">
        <label for="breed-counts-4">4</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-5">
        <label for="breed-counts-5">5</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-6">
        <label for="breed-counts-6">6</label>
      </span>

      <span class="breed-count-option">
        <input type="checkbox" id="breed-counts-7">
        <label for="breed-counts-7">7</label>
      </span>
    </div>
  </div>

  <!-- auction -->
  <div class="input-group">
    <label class="build-title aside">Auction:</label>

    <select name="auction" id="auction">
      <option value="all">All</option>
      <option value="sale">Sale</option>
      <option value="not_for_sale">Not For Sale</option>
    </select>

  </div>

  <!-- classes -->
  <div class="input-group">
    <label class="build-title header">Classes:</label>

    <div id="class-options">
      <div class="class-option" id="aquatic">
        Aquatic
      </div>
      <div class="class-option" id="beast">
        Beast
      </div>
      <div class="class-option" id="bird">
        Bird
      </div>
      <div class="class-option" id="bug">
        Bug
      </div>
      <div class="class-option" id="dawn">
        Dawn
      </div>
      <div class="class-option" id="dusk">
        Dusk
      </div>
      <div class="class-option" id="mech">
        Mech
      </div>
      <div class="class-option" id="plant">
        Plant
      </div>
      <div class="class-option" id="reptile">
        Reptile
      </div>

    </div>
  </div>

  <!-- minimum purity -->
  <div class="input-group">
    <label class="build-title aside">Minimum Purity:</label>
    <input type="text" name="minimum-purity" id="minimum-purity">
  </div>


  <!-- dominant genes -->
  <div class="input-group" id="dominant-genes">
    <label class="build-title header">Dominant Genes</label>

    <!-- eyes -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Eyes</span>
        <select name="eyes-dominant-select" id="eyes-dominant-select" class="body-part-select">
          <option value="default">Select Eyes</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- ears -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Ears</span>
        <select name="ears-dominant-select" id="ears-dominant-select" class="body-part-select">
          <option value="default">Select Ears</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- mouth -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Mouth</span>
        <select name="mouth-dominant-select" id="mouth-dominant-select" class="body-part-select">
          <option value="default">Select Mouth</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- horn -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Horn</span>
        <select name="horn-dominant-select" id="horn-dominant-select" class="body-part-select">
          <option value="default">Select Horn</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- back -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Back</span>
        <select name="back-dominant-select" id="back-dominant-select" class="body-part-select">
          <option value="default">Select Back</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- tail -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Tail</span>
        <select name="tail-dominant-select" id="tail-dominant-select" class="body-part-select">
          <option value="default">Select Tail</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

  </div>

  <!-- recessive genes -->
  <div class="input-group" id="recessive-genes">
    <label class="build-title header">Recessive Genes</label>

    <!-- eyes -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Eyes</span>
        <select name="eyes-recessive-select" id="eyes-recessive-select" class="body-part-select">
          <option value="default">Select Eyes</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- ears -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Ears</span>
        <select name="ears-recessive-select" id="ears-recessive-select" class="body-part-select">
          <option value="default">Select Ears</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- mouth -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Mouth</span>
        <select name="mouth-recessive-select" id="mouth-recessive-select" class="body-part-select">
          <option value="default">Select Mouth</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- horn -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Horn</span>
        <select name="horn-recessive-select" id="horn-recessive-select" class="body-part-select">
          <option value="default">Select Horn</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- back -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Back</span>
        <select name="back-recessive-select" id="back-recessive-select" class="body-part-select">
          <option value="default">Select Back</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

    <!-- tail -->
    <div class="body-part-container">
      <div class="body-part-header">
        <span class="body-part-name">Tail</span>
        <select name="tail-recessive-select" id="tail-recessive-select" class="body-part-select">
          <option value="default">Select Tail</option>
          <!-- enter other options through javascript -->
        </select>
      </div> 

      <div class="body-part-entries">
        <!-- example entry -->
        <!-- <div class="body-part-entry">Blossom</div> -->
      </div>
    </div>

  </div>

  <!-- match by -->
  <div class="input-group">

    <div id="match-by-header-container">
      <label class="build-title aside">Match By:</label>

      <select name="match-by" id="match-by">
        <option value="amount_of_impurities">Amount of Impurities</option>
        <option value="minimum_pair_purity">Minimum Pair Purity</option>
      </select>
    </div>

    <!-- minimum pair purity -->
    <div id="minimum-pair-purity-container">
      <label for="minimum-pair-purity">Minimum Pair Purity:</label>
      <input type="text" name="minimum-pair-purity" id="minimum-pair-purity">
    </div>


    <!-- impurities -->
    <div class="amounts-container" id="amount-of-impurities-container">
      <label>Impurities</label>

      <div>
        <div>
          <label for="impurities-d">D:</label>
          <input type="number" name="impurities-d" id="impurities-d">
        </div>
        
        <div>
          <label for="impurities-r1">R1:</label>
          <input type="number" name="impurities-r1" id="impurities-r1">
        </div>

        <div>
          <label for="impurities-r2">R2:</label>
          <input type="number" name="impurities-r2" id="impurities-r2">
        </div>
      </div>

    </div>

    <!-- clashes -->
    <div class="amounts-container">
      <label>Clashes</label>

      <div>
        <div>
          <label for="clashes-d">D:</label>
          <input type="number" name="clashes-d" id="clashes-d">
        </div>
        
        <div>
          <label for="clashes-r1">R1:</label>
          <input type="number" name="clashes-r1" id="clashes-r1">
        </div>

        <div>
          <label for="clashes-r2">R2:</label>
          <input type="number" name="clashes-r2" id="clashes-r2">
        </div>
      </div>
      
    </div>

    <!-- structures -->
    <div id="structures-container">
      <label>Structures</label>

      <!-- add structures -->
      <div class="structure-container">

        <!-- button -->
        <div class="structure-button-container">
          <button id="add-structure">+</button>
        </div>

        <!-- values -->
        <div class="structure-values-container">
          <div>
            <label for="added-d-structure-amount">D:</label>
            <input type="number" name="added-d-structure-amount" id="added-d-structure-amount">
          </div>
          
          <div>
            <label for="added-r1-structure-amount">R1:</label>
            <input type="number" name="added-r1-structure-amount" id="added-r1-structure-amount">
          </div>

          <div>
            <label for="added-r2-structure-amount">R2:</label>
            <input type="number" name="added-r2-structure-amount" id="added-r2-structure-amount">
          </div>
        </div>

      </div>


      <!-- structure example -->
      <!-- 
      <div class="structure-container">

        <div class="structure-button-container">
          <button class="delete-structure">x</button>
        </div>

        <div class="structure-values-container">
          <div>
            <label>D:</label>
            <input type="number" value="">
          </div>
          
          <div>
            <label>R1:</label>
            <input type="number" value="">
          </div>

          <div>
            <label>R2:</label>
            <input type="number" value="">
          </div>
        </div>

      </div> 
      -->
    </div>

  </div>


  <!-- amount of breeds -->
  <div class="input-group">
    <label class="build-title aside">Amount of Breeds:</label>
    <input type="checkbox" id="calculate-amount-of-breeds">

    <div id="amount-of-breeds-parameter-container">
      <label for="amount-of-breeds-parameter">Parameter: </label>
      <select id="amount-of-breeds-parameter">
        <option value="average_probability">Average Probability</option>
        <option value="average_purity">Average Purity</option>
      </select>
    </div>

    <div id="breeds-ranges-container">
      <label>Ranges</label>

      <div class="breeds-range">

        <div>
          <label for="amount-of-breeds">Amount of Breeds: </label>
          <input type="number" id="amount-of-breeds">
        </div>
        <div>
          <label for="upper-limit">Upper Limit: </label>
          <input type="number" id="upper-limit">
          <input type="checkbox" id="include-upper-limit">
        </div>
        <div>
          <label for="lower-limit">Lower Limit: </label>
          <input type="number" id="lower-limit">
          <input type="checkbox" id="include-lower-limit">
        </div>

        <button id="add-range">+</button>
      </div>

      <!-- example range -->
      <!-- <div class="breeds-range">
        <div>
          <label for="amount-of-breeds">Amount of Breeds: </label>
          <input type="number" id="amount-of-breeds">
        </div>
        <div>
          <label for="upper-limit">Upper Limit: </label>
          <input type="number" id="upper-limit">
          <input type="checkbox" id="include-upper-limit">
        </div>
        <div>
          <label for="lower-limit">Lower Limit: </label>
          <input type="number" id="lower-limit">
          <input type="checkbox" id="include-lower-limit">
        </div>

        <button class="delete-btn">x</button>
      </div> -->

    </div>

  </div>
  

  <!-- maximum execution time -->
  <div class="input-group">
    <label class="build-title aside">Maximum Execution Time:</label>
    <input type="text" name="maximum-execution-time" id="maximum-execution-time">
  </div>

  <!-- produce prices -->
  <div class="input-group">
    <label class="build-title aside">Produce Prices:</label>
    <input type="checkbox" name="produce-prices" id="produce-prices">
  </div>

  <!-- include axies -->
  <div class="input-group" id="include-axies-container">
    <label class="build-title header">Include Axies</label>

    <div class="enter-axies-input-container">
      <input type="text" placeholder="Axie Id" name="include-axies-input" id="include-axies-input" class="enter-axie-input">
      <span id="include-axies-icon-add" class="enter-axie-icon">+</span>
    </div>

    <!-- axie id -->
    <!-- 
    <div class="axie-id-container">
      <div class="axie-id">456</div>
      <span class="delete-axie-id-icon">x</span>          
    </div> 
    -->
  </div>

  <!-- exclude axies -->
  <div class="input-group" id="exclude-axies-container">
    <label class="build-title header">Exclude Axies</label>

    <div class="enter-axies-input-container">
      <input type="text" placeholder="Axie Id" name="exclude-axies-input" id="exclude-axies-input" class="enter-axie-input">
      <span id="exclude-axies-icon-add" class="enter-axie-icon">+</span>
    </div>

    <!-- axie id -->
    <!-- 
    <div class="axie-id-container">
      <div class="axie-id">456</div>
      <span class="delete-axie-id-icon">x</span>          
    </div> 
    -->
  </div>

  <!-- save / close buttons -->
  <div id="build-buttons-container">
    <div id="close-build">X</div>
    <div id="save-build">SAVE</div>
  </div>


  
</div>
`;

const defaultBuildObj = {
    id: '',
    name: '',
    ronins: [],

    results: {
        maximum_cases: '',
        sorted_by: [],
        
        selection: {
            automatically: false,
            from_result: 'average_probability',
            case: ''
        }
    },

    breed: [],
    auction: 'not_for_sale',
    class: [],
    minimum_purity: '',

    genes: {
        dominant: {
            eyes: [],
            ears: [],
            mouth: [],
            horn: [],
            back: [],
            tail: []
        },
        recessive: {
            eyes: [],
            ears: [],
            mouth: [],
            horn: [],
            back: [],
            tail: []
        }
    },

    match_by: 'minimum_pair_purity',

    match_by_settings: {
        minimum_pair_purity: '',
        impurities: {
            amounts: {
                "d": '', 
                "r1": '', 
                "r2": ''
            },
            clashes: {
                "d": '', 
                "r1": '', 
                "r2": ''
            },
            structures: []
        }  
    }, 

    breeds: {
        consider: false,
        parameter: 'average_probability',
        ranges: []
    },

    maximum_execution_time: '',
    produce_prices: false,

    include_axies: [],
    exclude_axies: [],

    results_created: []
}   


const createBuildButton = document.querySelector('#create-build-btn');

createBuildButton.addEventListener('click', function() {
    createBuild(defaultBuildHTML, JSON.parse(JSON.stringify(defaultBuildObj)));
});



function createBuild(defaultBuildHTML, loadedBuildObj) {

    clearShowcase();
    
    const showcase = document.querySelector('#showcase');

    // insert default build
    showcase.insertAdjacentHTML('afterbegin', defaultBuildHTML);


    // use loadedBuildObj to populate defaultBuildHTML in case we're loading 
    // a previously created build instead of creating a new one


    // ----------------------------------------------------------------------
    // create build id 

    let buildId;
    if (!loadedBuildObj.id) {
      buildId = String( Date.now() );

    } else {
      buildId = loadedBuildObj.id;
    }

    // store id of currently loaded build in order to know wether or not to remove it
    // from DOM if the build is completely removed from localStorage while still being 
    // loaded for updating
    lastLoadedBuildId = buildId;

    // ----------------------------------------------------------------------
    // build name 
    const buildName = document.querySelector('#name');
    buildName.value = loadedBuildObj.name;

    // ----------------------------------------------------------------------
    // ronins 

    // const addedRonins = [ 
    //     // {
    //     //     address: 'ronin:abc123',
    //     //     name: 'myRonin'
    //     // }
    // ];

    const addedRonins = loadedBuildObj.ronins;

    const addRoninBtn = document.querySelector(`#add-ronin-btn`);
    const inputRoninAddress = document.querySelector(`#ronin-address`);
    const inputRoninName = document.querySelector(`#ronin-name`);
    const addedRoninsContainer = document.querySelector(`#added-ronins`);

    // add loaded ronins to html
    for (let i = 0; i < addedRonins.length; i++) {
        const loadedRonin = addedRonins[i];
        createRoninEntry(loadedRonin, addedRonins, addedRoninsContainer);
    }


    addRoninBtn.addEventListener('click', function(e) {
        // get values of entered ronin
        const addedRoninAddress = inputRoninAddress.value;
        const addedRoninName = inputRoninName.value;

        // check added ronin doesn't have empty fields
        if (addedRoninAddress != '' && addedRoninName != '') {
            
            // reset add ronin fields
            inputRoninAddress.value = '';
            inputRoninName.value = '';

            const addedRoninInfo = {
                address: addedRoninAddress,
                name: addedRoninName
            }

            addedRonins.push(addedRoninInfo);
            createRoninEntry(addedRoninInfo, addedRonins, addedRoninsContainer);
        }

    });


    function createRoninEntry(roninInfo, addedRonins, addedRoninsContainer) {

        const roninEntryContainer = document.createElement('div');
        roninEntryContainer.classList.add('ronin-entry-container');

        // delete ronin btn functionality 
        const roninBtnContainer = document.createElement('div');
        roninBtnContainer.classList.add('ronin-btn-container');

        const deleteRoninBtn = document.createElement('button');
        deleteRoninBtn.classList.add('delete-ronin-btn');
        deleteRoninBtn.textContent = 'x';

        deleteRoninBtn.addEventListener('click', function(e) {
            // remove ronin from html
            roninEntryContainer.remove();

            // find ronin to be deleted in ronin
            let roninToBeDeletedIndex = -1;
            for (let i = 0; i < addedRonins.length; i++) {
                const currentRonin = addedRonins[i];
                
                if(currentRonin.address == roninInfo.address && currentRonin.name == roninInfo.name) {
                    roninToBeDeletedIndex = i;
                    break;
                }
            }
            
            if (roninToBeDeletedIndex > -1) {
              // remove ronin obj from added ronins array
              addedRonins.splice(roninToBeDeletedIndex, 1);
            }


        });

        roninBtnContainer.appendChild(deleteRoninBtn);
        roninEntryContainer.appendChild(roninBtnContainer);


        // ronin info
        const roninInfoToBeParsed = `
            <div class="ronin-info-container">
                <div>
                    <label>Address:</label>
                    <input type="text" value="${roninInfo.address}">
                </div> 
                <div>
                    <label>Name:</label>
                    <input type="text" value="${roninInfo.name}">
                </div>
            </div>
        `;

        roninEntryContainer.insertAdjacentHTML('beforeend', roninInfoToBeParsed);
        addedRoninsContainer.appendChild(roninEntryContainer);
    }

    // ----------------------------------------------------------------------
    // results 

    const maximumCases = document.querySelector('#maximum-cases');
    maximumCases.value = loadedBuildObj.results.maximum_cases;

    const averageProbability = document.querySelector('#average-probability');
    averageProbability.checked = loadedBuildObj.results.sorted_by.includes('average_probability');
    
    const averagePurity = document.querySelector('#average-purity');
    averagePurity.checked = loadedBuildObj.results.sorted_by.includes('average_purity');
    
    const automaticSelection = document.querySelector('#automatic-selection');
    automaticSelection.checked = loadedBuildObj.results.selection.automatically;
    
    const caseSelected = document.querySelector('#case-selected');
    caseSelected.value = loadedBuildObj.results.selection.case;

    const fromResult = document.querySelector('#from-result');
    fromResult.value = loadedBuildObj.results.selection.from_result;

    // call when save button triggered
    function getResultsSortedBy() {

        const resultsSortedBy = [];
        if (averageProbability.checked) {
            resultsSortedBy.push('average_probability');
        }
        if (averagePurity.checked) {
            resultsSortedBy.push('average_purity');
        }
        return resultsSortedBy;
    }

    // ----------------------------------------------------------------------
    // breed counts 

    for (let i = 0; i < loadedBuildObj.breed.length; i++) {
        const breedCount = loadedBuildObj.breed[i];
        const breedCountCheckbox = document.querySelector(`#breed-counts-${breedCount}`);
        
        breedCountCheckbox.checked = true;
    }

    // call when save button triggered
    function getSelectedBreedCounts() {
        const selectedBreedCounts = [];

        for (let i = 0; i < 8; i++) {
            const currentBreedCount = document.querySelector(`#breed-counts-${i}`);

            if (currentBreedCount.checked) {
                selectedBreedCounts.push(i);
            }
        }
        return selectedBreedCounts;
    }

    // ----------------------------------------------------------------------
    // auction
    const auction = document.getElementById('auction');
    auction.value = loadedBuildObj.auction;

    // ----------------------------------------------------------------------
    // classes

    const selectedClasses = loadedBuildObj.class;
    const classOptions = document.querySelectorAll('.class-option');

    for (let i = 0; i < classOptions.length; i++) {
    
        const classOption = classOptions[i];
        classOption.addEventListener('click', function() {

            const selectedClass = classOption.id;

            // check if targeted class is already in array (has been selected previously)
            if (!selectedClasses.includes(selectedClass)) {

                // not selected previously, so push it to array
                selectedClasses.push(selectedClass);
                // remove opacity
                classOption.style.opacity = '1';


            // class has been previously selected
            } else {

                // remove from selected classes
                const targetedClassIndex = selectedClasses.indexOf(selectedClass);
                if (targetedClassIndex > -1) {
                    selectedClasses.splice(targetedClassIndex, 1);
                }
                // add default opacity
                classOption.style.opacity = '0.45';

            }
        });


        // check if current class is already in loaded build
        // if so remove opacity, no need to push to array again
        if (selectedClasses.includes(classOption.id)) {

            // remove opacity
            classOption.style.opacity = '1';
        } 

    }

    // ----------------------------------------------------------------------
    // minimum purity
    const minimumPurity = document.querySelector('#minimum-purity');
    minimumPurity.value = loadedBuildObj.minimum_purity;

    // ----------------------------------------------------------------------
    // genes

    const allGenes = {
        eyes: ['Blossom', 'Bookworm', 'Chubby', 'Clear', 'Confused', 'Cucumber Slice', 'Gecko', 'Gero', 'Kotaro', 'Little Owl', 'Little Peas', 'Lucas', 'Mavis', 'Neo', 'Nerdy', 'Papi', 'Puppy', 'Robin', 'Scar', 'Sleepless', 'Telescope', 'Topaz', 'Tricky','Zeal'],

        ears: ['Beetle Spike', 'Belieber', 'Bubblemaker', 'Clover', 'Curly', 'Curved Spine', 'Ear Breathing', 'Early Bird', 'Earwing', 'Friezard', 'Gill', 'Hollow', 'Inkling', 'Innocent Lamb', 'Larva', 'Leaf Bug', 'Leafy', 'Little Owl', 'Lotus', 'Nimo', 'Nut Cracker', 'Nyan', 'Peace Maker', 'Pink Cheek', 'Pogona', 'Puppy', 'Risky Bird', 'Rosa', 'Sakura', 'Seaslug', 'Sidebarb', 'Small Frill', 'Swirl', 'Tassels', 'Tiny Fan', 'Zen'],

        mouth: ['Axie Kiss', 'Catfish', 'Confident', 'Cute Bunny', 'Doubletalk', 'Goda', 'Herbivore', 'Hungry Bird', 'Kotaro', 'Lam', 'Little Owl', 'Mosquito', 'Nut Cracker', 'Peace Maker', 'Pincer', 'Piranha', 'Razor Bite', 'Risky Fish', 'Serious', 'Silence Whisper', 'Square Teeth', 'Tiny Turtle', 'Toothless Bite', 'Zigzag'],

        horn: ['Anemone', 'Antenna', 'Arco', 'Babylonia', 'Bamboo Shoot', 'Beech', 'Bumpy', 'Cactus', 'Caterpillars', 'Cerastes', 'Clamshell', 'Cuckoo', 'Dual Blade', 'Eggshell', 'Feather Spear', 'Imp', 'Incisor', 'Kestrel', 'Lagging', 'Leaf Bug', 'Little Branch', 'Merry', 'Oranda', 'Parasite', 'Pliers', 'Pocky', 'Rose Bud', 'Scaly Spear', 'Scaly Spoon', 'Shoal Star', 'Strawberry Shortcake', 'Teal Shell', 'Trump', 'Unko', 'Watermelon', 'Wing Horn'],

        back: ['Anemone', 'Balloon', 'Bidens', 'Blue Moon', 'Bone Sail', 'Buzz Buzz', 'Croc', 'Cupid', 'Furball', 'Garish Worm', 'Goldfish', 'Green Thorns', 'Hermit', 'Hero', 'Indian Star', 'Jaguar', 'Kingfisher', 'Mint', 'Perch', 'Pigeon Post', 'Pumpkin', 'Raven', 'Red Ear', 'Risky Beast', 'Ronin', 'Sandal', 'Scarab', 'Shiitake', 'Snail Shell', 'Spiky Wing', 'Sponge', 'Timber', 'Tri Feather', 'Tri Spikes', 'Turnip', 'Watering Can'],

        tail: ['Ant', 'Carrot', 'Cattail', 'Cloud', 'Cottontail', 'Feather Fan', 'Fish Snack', 'Gerbil', 'Gila', "Granma's Fan", 'Grass Snake', 'Gravel Ant', 'Hare', 'Hatsune', 'Hot Butt', 'Iguana', 'Koi', 'Navaga', 'Nimo', 'Nut Cracker', 'Post Fight', 'Potato Leaf', 'Pupae', 'Ranchu', 'Rice', 'Shiba', 'Shrimp', 'Snake Jar', 'Swallow', 'Tadpole', 'The Last One', 'Thorny Caterpillar', 'Tiny Dino', 'Twin Tail', 'Wall Gecko', 'Yam']
    }

    const bodyParts = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail'];
    const typeOfGenes = ['dominant', 'recessive'];

    // selected genes in build
    const selectedGenes = JSON.parse(JSON.stringify(loadedBuildObj.genes));

    // loop through type of genes to create options for both dominant and recessive genes
    for (let i = 0; i < typeOfGenes.length; i++) {
        const typeOfGene = typeOfGenes[i];

        // loop through body parts to create genes options for each body part and handle add/deletion
        for (let j = 0; j < bodyParts.length; j++) {
            const currentBodyPart = bodyParts[j];

            const inputTypeOfGeneGenesCurrentBodyPart = document.getElementById(`${currentBodyPart}-${typeOfGene}-select`);
            const selectedTypeOfGeneGenesCurrentBodyPart = inputTypeOfGeneGenesCurrentBodyPart.parentElement.nextElementSibling;
            
            // add all available current body part genes options
            for (let k = 0; k < allGenes[currentBodyPart].length; k++) {
                const currentBodyPartGene = allGenes[currentBodyPart][k];
            
                inputTypeOfGeneGenesCurrentBodyPart.innerHTML += `<option value="${currentBodyPartGene}">${currentBodyPartGene}</option>`;
            }
            

            inputTypeOfGeneGenesCurrentBodyPart.addEventListener('click', function(e) {
                
                const selectedGene = inputTypeOfGeneGenesCurrentBodyPart.value;
            
                if (selectedGene != 'default' && !selectedGenes[typeOfGene][currentBodyPart].includes(selectedGene)) {
                    // add selected gene to selected genes obj
                    selectedGenes[typeOfGene][currentBodyPart].push(selectedGene);
            
                    // create html element
                    const selectedGeneDiv = document.createElement('div');
                    selectedGeneDiv.classList.add('body-part-entry');
                    selectedGeneDiv.textContent = selectedGene;
            
                    // add selected gene to entries
                    selectedTypeOfGeneGenesCurrentBodyPart.appendChild(selectedGeneDiv);
            
                    // add event listener for deletion
                    selectedGeneDiv.addEventListener('click', function(e) {
            
                        // remove element from array
                        const geneIndex = selectedGenes[typeOfGene][currentBodyPart].indexOf(selectedGene);
                        if (geneIndex > -1) {
                            selectedGenes[typeOfGene][currentBodyPart].splice(geneIndex, 1);
                        }
                        // remove from html
                        selectedGeneDiv.remove();
                    });
                }
            
                // reset to default value
                inputTypeOfGeneGenesCurrentBodyPart.selectedIndex = 0;
            });
            
        }

    }


    // show loaded genes in html
    for (let i = 0; i < typeOfGenes.length; i++) {
        const typeOfGene = typeOfGenes[i];

        for (let j = 0; j < bodyParts.length; j++) {
            const currentBodyPart = bodyParts[j];
            
            const inputTypeOfGeneGenesCurrentBodyPart = document.getElementById(`${currentBodyPart}-${typeOfGene}-select`);
            const selectedTypeOfGeneGenesCurrentBodyPart = inputTypeOfGeneGenesCurrentBodyPart.parentElement.nextElementSibling;   

            for (let k = 0; k < selectedGenes[typeOfGene][currentBodyPart].length; k++) {
                const currentBodyPartGeneLoaded = selectedGenes[typeOfGene][currentBodyPart][k];

                // create html element
                const selectedGeneDiv = document.createElement('div');
                selectedGeneDiv.classList.add('body-part-entry');
                selectedGeneDiv.textContent = currentBodyPartGeneLoaded;
        
                // add selected gene to entries
                selectedTypeOfGeneGenesCurrentBodyPart.appendChild(selectedGeneDiv);
        
                // add event listener for deletion
                selectedGeneDiv.addEventListener('click', function(e) {
        
                    // remove element from array
                    const geneIndex = selectedGenes[typeOfGene][currentBodyPart].indexOf(currentBodyPartGeneLoaded);
                    if (geneIndex > -1) {
                        selectedGenes[typeOfGene][currentBodyPart].splice(geneIndex, 1);
                    }
                    // remove from html
                    selectedGeneDiv.remove();
                });              
            }
        }
    }


    // ----------------------------------------------------------------------
    // match by

    const addedStructures = loadedBuildObj.match_by_settings.impurities.structures;
    const structuresContainer = document.querySelector('#structures-container');

    // add loaded strucutures to DOM
    for (let i = 0; i < addedStructures.length; i++) {
      const loadedStructure = addedStructures[i];
      
      // create loaded structure in HTML
      const structureContainer = document.createElement('div');
      structureContainer.classList.add('structure-container');

      const structureBtnContainer = document.createElement('div');
      structureBtnContainer.classList.add('structure-button-container');

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('delete-structure');
      deleteBtn.textContent = 'x';

      structureBtnContainer.appendChild(deleteBtn);
      structureContainer.appendChild(structureBtnContainer);


      const structureValuesContainer = `
      <div class="structure-values-container">
          <div>
              <label>D:</label>
              <input type="number" value="${loadedStructure.d}">
          </div>
          
          <div>
              <label>R1:</label>
              <input type="number" value="${loadedStructure.r1}">
          </div>

          <div>
              <label>R2:</label>
              <input type="number" value="${loadedStructure.r2}">
          </div>
      </div>`;

      structureContainer.insertAdjacentHTML('beforeend', structureValuesContainer);
      structuresContainer.appendChild(structureContainer);


      // delete structure functionality
      deleteBtn.addEventListener('click', function(e) {
          structureContainer.remove();
          
          let structureToBeRemovedIndex = -1;
          for (let i = 0; i < addedStructures.length; i++) {
              const structure = addedStructures[i];
      
              if (structure.d == loadedStructure.d && 
                  structure.r1 == loadedStructure.r1 &&
                  structure.r2 == loadedStructure.r2) {
                  
                  structureToBeRemovedIndex = i;
                  break;
              }
          }

          if (structureToBeRemovedIndex > -1) {
            addedStructures.splice(structureToBeRemovedIndex, 1);
          }

      });

    }

    const addStructureBtn = document.querySelector('#add-structure');
    // to get structure values
    const addedStructureD = document.querySelector('#added-d-structure-amount');
    const addedStructureR1 = document.querySelector('#added-r1-structure-amount');
    const addedStructureR2 = document.querySelector('#added-r2-structure-amount');

    addStructureBtn.addEventListener('click', function(e) {

        // get values entered
        const addedStructure = {
            d: Number(addedStructureD.value),
            r1: Number(addedStructureR1.value), 
            r2: Number(addedStructureR2.value)
        }

        // make sure added strucuture is not default empty strings
        if (addedStructureD.value != '' && addedStructureR1.value != '' && addedStructureR2.value != '') {
            
            // reset input values 
            addedStructureD.value = '';
            addedStructureR1.value = '';
            addedStructureR2.value = '';

            let addedStructureIsNew = true;
            for (let i = 0; i < addedStructures.length; i++) {
                const structure = addedStructures[i];

                if (structure.d == addedStructure.d && 
                    structure.r1 == addedStructure.r1 &&
                    structure.r2 == addedStructure.r2) {
                    
                    addedStructureIsNew = false;
                    break;
                }
            }

            if (addedStructureIsNew) {
                // push added structure to added structures array
                addedStructures.push(addedStructure);

                // create added structure in HTML
                const structureContainer = document.createElement('div');
                structureContainer.classList.add('structure-container');

                const structureBtnContainer = document.createElement('div');
                structureBtnContainer.classList.add('structure-button-container');

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-structure');
                deleteBtn.textContent = 'x';

                structureBtnContainer.appendChild(deleteBtn);
                structureContainer.appendChild(structureBtnContainer);


                const structureValuesContainer = `
                <div class="structure-values-container">
                    <div>
                        <label>D:</label>
                        <input type="number" value="${addedStructure.d}">
                    </div>
                    
                    <div>
                        <label>R1:</label>
                        <input type="number" value="${addedStructure.r1}">
                    </div>

                    <div>
                        <label>R2:</label>
                        <input type="number" value="${addedStructure.r2}">
                    </div>
                </div>`;

                structureContainer.insertAdjacentHTML('beforeend', structureValuesContainer);
                structuresContainer.appendChild(structureContainer);


                // delete structure functionality
                deleteBtn.addEventListener('click', function(e) {
                    structureContainer.remove();
                    
                    let structureToBeRemovedIndex = -1;
                    for (let i = 0; i < addedStructures.length; i++) {
                        const structure = addedStructures[i];
                
                        if (structure.d == addedStructure.d && 
                            structure.r1 == addedStructure.r1 &&
                            structure.r2 == addedStructure.r2) {
                            
                            structureToBeRemovedIndex = i;
                            break;
                        }
                    }

                    if (structureToBeRemovedIndex > -1) {
                      addedStructures.splice(structureToBeRemovedIndex, 1);
                    }

                });

            }

        }

    });

    const matchBy = document.querySelector('#match-by');
    matchBy.value = loadedBuildObj.match_by;

    const minimumPairPurity = document.querySelector('#minimum-pair-purity');
    minimumPairPurity.value = loadedBuildObj.match_by_settings.minimum_pair_purity;

    const impuritiesD = document.querySelector('#impurities-d');
    impuritiesD.value = loadedBuildObj.match_by_settings.impurities.amounts.d;

    const impuritiesR1 = document.querySelector('#impurities-r1');
    impuritiesR1.value = loadedBuildObj.match_by_settings.impurities.amounts.r1;

    const impuritiesR2 = document.querySelector('#impurities-r2');
    impuritiesR2.value = loadedBuildObj.match_by_settings.impurities.amounts.r2;

    const clashesD = document.querySelector('#clashes-d');
    clashesD.value = loadedBuildObj.match_by_settings.impurities.clashes.d;

    const clashesR1 = document.querySelector('#clashes-r1');
    clashesR1.value = loadedBuildObj.match_by_settings.impurities.clashes.r1;

    const clashesR2 = document.querySelector('#clashes-r2');
    clashesR2.value = loadedBuildObj.match_by_settings.impurities.clashes.r2;

    // ----------------------------------------------------------------------
    // amount of breeds

    const addedBreedsRanges = loadedBuildObj.breeds.ranges;
    const breedsRangesContainer = document.querySelector('#breeds-ranges-container');

    // add loaded ranges to DOM
    for (let i = 0; i < addedBreedsRanges.length; i++) {
      const loadedRange = addedBreedsRanges[i];

      const breedsRange = document.createElement('div');
      breedsRange.classList.add('breeds-range');

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'x';
      deleteBtn.classList.add('delete-btn');

      breedsRange.appendChild(deleteBtn);

      deleteBtn.addEventListener('click', function(e) {
          // remove from html
          breedsRange.remove();

          // remove from addedBreedsRanges
          let rangeToBeDeletedIndex = -1;
          for (let i = 0; i < addedBreedsRanges.length; i++) {
              const currentRange = addedBreedsRanges[i];

              if (
                  currentRange.amount_of_breeds == loadedRange.amount_of_breeds &&
                  currentRange.upper_limit.value == loadedRange.upper_limit.value &&
                  currentRange.upper_limit.includes_limit == loadedRange.upper_limit.includes_limit &&
                  currentRange.lower_limit.value == loadedRange.lower_limit.value &&
                  currentRange.lower_limit.includes_limit == loadedRange.lower_limit.includes_limit
              ) {
                  rangeToBeDeletedIndex = i;
                  break;
              }  
          }

          if (rangeToBeDeletedIndex > -1) {
            addedBreedsRanges.splice(rangeToBeDeletedIndex, 1);
          }
      });

      // check to see if limits are included
      // by default limits are excluded
      let upperLimitIsIncluded = '';
      let lowerLimitIsIncluded = '';

      if (loadedRange.upper_limit.includes_limit) {
          upperLimitIsIncluded = 'checked';
      }
      if (loadedRange.lower_limit.includes_limit) {
          lowerLimitIsIncluded = 'checked';
      }
      
      const loadedRangeToBeInserted = `
      <div>
          <label>Amount of Breeds: </label>
          <input type="number" value="${loadedRange.amount_of_breeds}">
      </div>

      <div>
          <label>Upper Limit: </label>
          <input type="number" value="${loadedRange.upper_limit.value}">
          <input type="checkbox" ${upperLimitIsIncluded}>
      </div>

      <div>
          <label>Lower Limit: </label>
          <input type="number" value="${loadedRange.lower_limit.value}">
          <input type="checkbox" ${lowerLimitIsIncluded}>
      </div>
      `;

      breedsRange.insertAdjacentHTML('afterbegin', loadedRangeToBeInserted);

      breedsRangesContainer.appendChild(breedsRange);
    }

    // add ranges functionality
    const addBreedsRange = document.querySelector('#add-range');

    const amountOfBreeds = document.querySelector('#amount-of-breeds');
    const upperLimit = document.querySelector('#upper-limit');
    const includeUpperLimit = document.querySelector('#include-upper-limit');
    const lowerLimit = document.querySelector('#lower-limit');
    const includeLowerLimit = document.querySelector('#include-lower-limit');

    addBreedsRange.addEventListener('click', function(e) {

        const addedRange =     {
            amount_of_breeds: Number(amountOfBreeds.value),
            upper_limit: {value: Number(upperLimit.value), includes_limit: includeUpperLimit.checked},
            lower_limit: {value: Number(lowerLimit.value), includes_limit: includeLowerLimit.checked}
        }

        // reset add range fields
        amountOfBreeds.value = '';
        upperLimit.value = '';
        lowerLimit.value = '';
        includeUpperLimit.checked = false;
        includeLowerLimit.checked = false;

        // push to added ranges
        // there's no checking with previous ranges to prohibit repeated ranges
        // also no checking to see the range makes sense
        addedBreedsRanges.push(addedRange);

        const breedsRange = document.createElement('div');
        breedsRange.classList.add('breeds-range');

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'x';
        deleteBtn.classList.add('delete-btn');

        breedsRange.appendChild(deleteBtn);

        deleteBtn.addEventListener('click', function(e) {
            // remove from html
            breedsRange.remove();

            // remove from addedBreedsRanges
            let rangeToBeDeletedIndex = -1;
            for (let i = 0; i < addedBreedsRanges.length; i++) {
                const currentRange = addedBreedsRanges[i];

                if (
                    currentRange.amount_of_breeds == addedRange.amount_of_breeds &&
                    currentRange.upper_limit.value == addedRange.upper_limit.value &&
                    currentRange.upper_limit.includes_limit == addedRange.upper_limit.includes_limit &&
                    currentRange.lower_limit.value == addedRange.lower_limit.value &&
                    currentRange.lower_limit.includes_limit == addedRange.lower_limit.includes_limit
                ) {
                    rangeToBeDeletedIndex = i;
                    break;
                }  
            }

            if (rangeToBeDeletedIndex > -1) {
              addedBreedsRanges.splice(rangeToBeDeletedIndex, 1);
            }

        });

        // check to see if limits are included
        // by default limits are excluded
        let upperLimitIsIncluded = '';
        let lowerLimitIsIncluded = '';

        if (addedRange.upper_limit.includes_limit) {
            upperLimitIsIncluded = 'checked';
        }
        if (addedRange.lower_limit.includes_limit) {
            lowerLimitIsIncluded = 'checked';
        }
        
        const addedRangeToBeInserted = `
        <div>
            <label>Amount of Breeds: </label>
            <input type="number" value="${addedRange.amount_of_breeds}">
        </div>

        <div>
            <label>Upper Limit: </label>
            <input type="number" value="${addedRange.upper_limit.value}">
            <input type="checkbox" ${upperLimitIsIncluded}>
        </div>

        <div>
            <label>Lower Limit: </label>
            <input type="number" value="${addedRange.lower_limit.value}">
            <input type="checkbox" ${lowerLimitIsIncluded}>
        </div>
        `;

        breedsRange.insertAdjacentHTML('afterbegin', addedRangeToBeInserted);

        breedsRangesContainer.appendChild(breedsRange);

    });


    const calculateAmountOfBreeds = document.querySelector('#calculate-amount-of-breeds');
    calculateAmountOfBreeds.checked = loadedBuildObj.breeds.consider;

    const amountOfBreedsParameter = document.querySelector('#amount-of-breeds-parameter');
    amountOfBreedsParameter.value = loadedBuildObj.breeds.parameter;

    // ----------------------------------------------------------------------
    // maximum execution time
    const maximumExecutionTime = document.querySelector('#maximum-execution-time');
    maximumExecutionTime.value = loadedBuildObj.maximum_execution_time;

    // ----------------------------------------------------------------------
    // produce prices
    const producePrice = document.querySelector('#produce-prices');
    producePrice.checked = loadedBuildObj.produce_prices;

    // ----------------------------------------------------------------------
    // include axies
    const includedAxies = loadedBuildObj.include_axies;
    const includeAxiesContainer = document.getElementById('include-axies-container');
    const includeAxiesInput = document.getElementById('include-axies-input');
    const includeAxiesAddButton = document.getElementById('include-axies-icon-add')

    includeAxiesAddButton.addEventListener('click', function() {
        const addedAxie = includeAxiesInput.value;
        // check input is not empty string
        // check axie hasn't been previously added
        if (!includedAxies.includes(addedAxie) && addedAxie != '') {
            
            // add axie to included axies array
            includedAxies.push(addedAxie);

            // reset input to default
            includeAxiesInput.value = '';

            // add axie to DOM
            addAxieToDOM(addedAxie, includeAxiesContainer);
        }
    });

    // add loaded included axies to dom
    for (let i = 0; i < includedAxies.length; i++) {
        const includedAxie = includedAxies[i];
        
        addAxieToDOM(includedAxie, includeAxiesContainer);
    }

    // ----------------------------------------------------------------------
    // exclude axies
    const excludedAxies = loadedBuildObj.exclude_axies;
    const excludeAxiesContainer = document.getElementById('exclude-axies-container');
    const excludeAxiesInput = document.getElementById('exclude-axies-input');
    const excludeAxiesAddButton = document.getElementById('exclude-axies-icon-add')

    excludeAxiesAddButton.addEventListener('click', function() {
        const addedAxie = excludeAxiesInput.value;
        // check input is not empty string
        // check axie hasn't been previously added
        if (!excludedAxies.includes(addedAxie) && addedAxie != '') {
            
            // add axie to excluded axies array
            excludedAxies.push(addedAxie);

            // reset input value
            excludeAxiesInput.value = '';

            // add axie to DOM
            addAxieToDOM(addedAxie, excludeAxiesContainer);
        }
    });

    // add loaded excluded axies to dom
    for (let i = 0; i < excludedAxies.length; i++) {
        const excludedAxie = excludedAxies[i];
        
        addAxieToDOM(excludedAxie, excludeAxiesContainer)
    }

    function addAxieToDOM(axie, container) {

        const axieAddedContainer = document.createElement('div');
        axieAddedContainer.classList.add('axie-id-container')

        const axieId = document.createElement('div');
        axieId.classList.add('axie-id');
        axieId.textContent = axie;

        const deleteAxieIdIcon = document.createElement('span');
        deleteAxieIdIcon.classList.add('delete-axie-id-icon');
        deleteAxieIdIcon.textContent = 'x';

        
        // add event listener to delete button created previously
        deleteAxieIdIcon.addEventListener('click', function() {
            const axieIdContainer = deleteAxieIdIcon.parentNode;

            // get axie id to be removed from html so it can be removed from excluded or includes axies array
            const axieId = deleteAxieIdIcon.previousElementSibling.textContent;

            // check if axie is in exclude or include-axies overall container to see from which array to delete
            if (container.id == 'exclude-axies-container') {
                const axieIdIndex = excludedAxies.indexOf(axieId);
                if (axieIdIndex > -1) {
                    excludedAxies.splice(axieIdIndex, 1);
                }

            } else if (container.id == 'include-axies-container') {
                const axieIdIndex = includedAxies.indexOf(axieId);
                if (axieIdIndex > -1) {
                    includedAxies.splice(axieIdIndex, 1);
                }
            }

            // remove axie entry entirely
            axieIdContainer.remove();
        });


        axieAddedContainer.appendChild(axieId);
        axieAddedContainer.appendChild(deleteAxieIdIcon);
        
        container.appendChild(axieAddedContainer);
    }

    // ----------------------------------------------------------------------
    // save build

    const saveBuildBtn = document.querySelector('#save-build');

    saveBuildBtn.addEventListener('click', function(e) {

        // get info of created build

        const createdBuild = {
            id: buildId,
            name: buildName.value,
            ronins: addedRonins,

            results: {
                maximum_cases: Number(maximumCases.value),
                sorted_by: getResultsSortedBy(),
                
                selection: {
                    automatically: automaticSelection.checked,
                    from_result: fromResult.value,
                    case: Number(caseSelected.value)
                }
            },
        
            breed: getSelectedBreedCounts(),
            auction: auction.value,
            class: selectedClasses,
            minimum_purity: Number(minimumPurity.value),

            genes: selectedGenes,
        
            match_by: matchBy.value,

            match_by_settings: {
              minimum_pair_purity: Number(minimumPairPurity.value),
              impurities: {
                amounts: {
                  "d": Number(impuritiesD.value), 
                  "r1": Number(impuritiesR1.value), 
                  "r2": Number(impuritiesR2.value)
                },
                clashes: {
                  "d": Number(clashesD.value), 
                  "r1": Number(clashesR1.value), 
                  "r2": Number(clashesR2.value)
                },
                structures: addedStructures
              }  
            },
        
            breeds: {
                consider: calculateAmountOfBreeds.checked,
                parameter: amountOfBreedsParameter.value,
                ranges: addedBreedsRanges
            },

            maximum_execution_time: Number(maximumExecutionTime.value),
            produce_prices: producePrice.checked,

            include_axies: includedAxies,
            exclude_axies: excludedAxies,

            results_created: getBuildResultsCreated(buildId)
        }    

        // build name cannot be empty string
        if (createdBuild.name) {
          
          console.log(`Build '${createdBuild.id} _ ${createdBuild.name}' created/updated!`)
          addBuildToStorage(createdBuild);

          // updated build list
          updateAvailableBuilds();

          // update name if build is currently selected 
          if (selectedBuildsIds.includes(createdBuild.id)) {
            const buildContainer = document.querySelector(`#build-${createdBuild.id}`);
            const buildName = buildContainer.querySelector('.build-name')

            buildName.textContent = createdBuild.name;
          }



        } else {
          console.log(`Build must have a name!`);
        }
        




        

        

        // window.preloadFunctions.writeBuildElectron(createdBuild);
    });


    // ----------------------------------------------------------------------
    // close build

    const closeBuildBtn = document.querySelector('#close-build');

    closeBuildBtn.addEventListener('click', function(e) {
      const currentBuildContainer = closeBuildBtn.closest('#create-build-process-container');

      // remove currently loaded build from DOM
      currentBuildContainer.remove();
    });
    



}





// ----------------------------------------------------------------------
// get selected case

function getSelectedCases() {

  const selectedCases = JSON.parse(window.localStorage.getItem('selectedCases'));

  return selectedCases;
}


// ----------------------------------------------------------------------
// add selected case
function addSelectedCase(selectedCase) {

  const currentSelectedCases = getSelectedCases();

  currentSelectedCases.push(selectedCase);

  window.localStorage.setItem('selectedCases', JSON.stringify(currentSelectedCases));
}


// ----------------------------------------------------------------------
// delete selected case
function deleteSelectedCase(caseToBeDeleted) {

  const currentSelectedCases = getSelectedCases();

  let caseToBeDeletedIndex = -1;
  for (let i = 0; i < currentSelectedCases.length; i++) {
    const selectedCase = currentSelectedCases[i];

    if ( 
      (selectedCase.result_id == caseToBeDeleted.result_id) &&
      (selectedCase.result_type == caseToBeDeleted.result_type) && 
      (selectedCase.case.case_number == caseToBeDeleted.case.case_number)
      ) {
        caseToBeDeletedIndex = i;
        break;
    }

  }

  if (caseToBeDeletedIndex > -1) {
    currentSelectedCases.splice(caseToBeDeletedIndex, 1);
  }

  window.localStorage.setItem('selectedCases', JSON.stringify(currentSelectedCases));



}



// ----------------------------------------------------------------------
// clear showcase

function clearShowcase() {

  const showcase = document.querySelector('#showcase');

  // remove build that has already been loaded as html
  const alreadyLoadedBuild = showcase.querySelector('#create-build-process-container');
  if (alreadyLoadedBuild) {
      alreadyLoadedBuild.remove();
  }

  // remove build result that has already been loaded as html
  const alreadyLoadedBuildResult = showcase.querySelector('#build-result-screen');
  if (alreadyLoadedBuildResult) {
      alreadyLoadedBuildResult.remove();
  }

  // remove selected cases that has already been loaded as html
  const alreadyLoadedSelectedCases = showcase.querySelector('#selected-cases-screen');
  if (alreadyLoadedSelectedCases) {
      alreadyLoadedSelectedCases.remove();
  }

}

// ----------------------------------------------------------------------
// add build to storage

function addBuildToStorage(build) {

    window.localStorage.setItem(build.id, JSON.stringify(build));
}

// ----------------------------------------------------------------------
// get current build results 

function getBuildResultsCreated(buildId) {
  const buildInfo = window.localStorage.getItem(buildId);

  if (buildInfo) {
    const buildResultsCreated = JSON.parse(buildInfo).results_created;
    return buildResultsCreated;

  } else {
    return [];
  }
}






// ----------------------------------------------------------------------
// gene formatted

function getGeneFormatted(gene) {

    let geneFormatted = gene.toLowerCase();
    geneFormatted = geneFormatted.split(' ').join('-');

    return geneFormatted;

}








// ----------------------------------------------------------------------
// for sorting array of words alphabetically
function bubbleSortWords(arr) {
     
  for(let i = 0; i < arr.length; i++){ 
    for(let j = 0; j < ( arr.length - i -1 ); j++){
        
      if ( !firstWordLower(arr[j], arr[j+1]) ) {
        const temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j+1] = temp
      }
    }
  }

  return arr;
}

function firstWordLower(firstWord, secondWord) {

  const lengthShorterWord = Math.min(firstWord.length, secondWord.length);
  let firstWordIsLower;

  for(let i = 0; i < lengthShorterWord; i++) {
    const firstWordCurrentCharacterValue = firstWord.toLowerCase().charCodeAt(i); 
    const secondWordCurrentCharacterValue = secondWord.toLowerCase().charCodeAt(i); 

    if (firstWordCurrentCharacterValue < secondWordCurrentCharacterValue) {
      firstWordIsLower = true;
      break;

    } else if (secondWordCurrentCharacterValue < firstWordCurrentCharacterValue) {
      firstWordIsLower = false;
      break;
    }
  }

  if (firstWordIsLower == undefined) {
    if (firstWord.length <= secondWord.length) {
      firstWordIsLower = true;

    } else {
      firstWordIsLower = false;
    }
  }

  return firstWordIsLower;
}








// ----------------------------------------------------------------------
// insertion sort
function insertionSortOrder(inputArr) {
  let n = inputArr.length;
  for (let i = 1; i < n; i++) {
    
      let current = inputArr[i];
      let j = i-1; 
      while ((j > -1) && (current.order < inputArr[j].order)) {
          inputArr[j+1] = inputArr[j];
          j--;
      }
      inputArr[j+1] = current;
  }

  return inputArr;
}










// ----------------------------------------------------------------------
// electron functions

function electronMatchBuilds(buildsAndSelectedCasesObj) {
  return ipcRenderer.invoke('matchBuilds', buildsAndSelectedCasesObj);
}

function electronUnmatchBuilds() {
  return ipcRenderer.invoke('unmatchBuilds');
}






// handle results coming from main (actual results from matching process)
ipcRenderer.on('resultsFromMain', function(event, arg) {

  // arg[i] = {build: buildObj, resultsCreated: [results]}


  console.log('Renderer obtained results from worker');
  // update localStorage with results 
  // select cases if specified in build



  for (let i = 0; i < arg.length; i++) {
    const buildAndNewlyCreatedResults = arg[i];


    // update results created on each build to add newly created results

    const buildAlreadyExistingResultsInCurrentTime = getBuildResultsCreated( buildAndNewlyCreatedResults.build.id );

    // add newly created results to preexisting results
    for (let j = 0; j < buildAndNewlyCreatedResults.resultsCreated.length; j++) {
      const newlyCreatedResult = buildAndNewlyCreatedResults.resultsCreated[j];

      buildAlreadyExistingResultsInCurrentTime.push(newlyCreatedResult);
    }


    // update build results in local storage
    const buildObjInCurrentTime = JSON.parse(localStorage.getItem( buildAndNewlyCreatedResults.build.id ));

    buildObjInCurrentTime.results_created = buildAlreadyExistingResultsInCurrentTime;
    
    localStorage.setItem(buildAndNewlyCreatedResults.build.id, JSON.stringify(buildObjInCurrentTime));







    
    // select case automatically if specified in build and change selectedBuilds in local storage
    
    if ( Boolean( buildAndNewlyCreatedResults.build.results.selection.automatically ) ) {
      
      const caseToBeSelected = Number( buildAndNewlyCreatedResults.build.results.selection.case );
      let resultTypeFromWhichCaseWillBeSelected;

      if ( buildAndNewlyCreatedResults.build.results.selection.from_result == 'average_probability' ) {
        resultTypeFromWhichCaseWillBeSelected = 'Probability'

      } else if ( buildAndNewlyCreatedResults.build.results.selection.from_result == 'average_purity' ) {
        resultTypeFromWhichCaseWillBeSelected = 'Purity'
      }


      // find result from which case will be selected
      let resultFromWhichCaseWillBeSelected;

      for (let j = 0; j < buildAndNewlyCreatedResults.resultsCreated.length; j++) {
        const newlyCreatedResult = buildAndNewlyCreatedResults.resultsCreated[j];

        if (newlyCreatedResult.type == resultTypeFromWhichCaseWillBeSelected) {
          resultFromWhichCaseWillBeSelected = newlyCreatedResult;
          break;
        }
      }

      const caseSelected = resultFromWhichCaseWillBeSelected.results.cases[caseToBeSelected];


      const selectedCaseObj = {
        result_id: resultFromWhichCaseWillBeSelected.id,
        result_type: resultFromWhichCaseWillBeSelected.type,
        build_name: buildAndNewlyCreatedResults.build.name,
        case: {
          case_number: String(caseToBeSelected),
          amount_of_pairs: caseSelected.amount_of_pairs,
          average_probability: caseSelected.average_probability,
          average_probability_difference: caseSelected.average_probability_difference,
          average_purity: caseSelected.average_purity,
          average_purity_difference: caseSelected.average_purity_difference,
    
          axs: caseSelected.axs,
          slp: caseSelected.slp,
    
          pairs: caseSelected.pairs
        }
      }

      addSelectedCase(selectedCaseObj);
    }


  }



  // create overlay to show matching process has finished

  const body = document.querySelector('body');

  const matchCompletedOverlay = document.createElement('div');
  matchCompletedOverlay.id = 'match-completed-overlay';

  matchCompletedOverlay.innerHTML = `

  <div id="match-completed">
    MATCH COMPLETED
  </div>

  <div>
    SELECT BUILDS AGAIN TO SEE THE UPDATED RESULTS
  </div>
  `;


  body.appendChild(matchCompletedOverlay);


  // create button to remove overlay

  const closeMatchCompletedOverlay = document.createElement('div');
  closeMatchCompletedOverlay.id = 'close-match-completed-overlay';
  closeMatchCompletedOverlay.textContent = 'CLOSE';

  closeMatchCompletedOverlay.addEventListener('click', function() {

    matchCompletedOverlay.remove();
    closeMatchCompletedOverlay.remove();

  });

  body.appendChild(closeMatchCompletedOverlay);



  // hide stop button
  stopBtnEl.style.display = 'none';
  // display match button
  matchBtnEl.style.display = 'block';

});


// make sure worker window doesnt show