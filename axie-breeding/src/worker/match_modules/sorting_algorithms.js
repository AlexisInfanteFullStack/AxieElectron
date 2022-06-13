//  -------------------------------------------------------------------------------------------------------

// Sorting algorithms

// ---------------------------------------------------------------------------------------------------------------

function swap(items, leftIndex, rightIndex){
    var temp = items[leftIndex];
    items[leftIndex] = items[rightIndex];
    items[rightIndex] = temp;
}
  
// ---------------------------------------------------------------------------------------------------------------
  
function partition_by_elements_property(items, left, right, property) {
    let pivot   = items[Math.floor((right + left) / 2)], 
        i       = left, 
        j       = right; 
  
    while (i <= j) {
        while (items[i][property] > pivot[property]) {
            i++;
        }
        while (items[j][property] < pivot[property]) {
            j--;
        }
        if (i <= j) {
            swap(items, i, j); 
            i++;
            j--;
        }
    }
    return i;
}
  
// ---------------------------------------------------------------------------------------------------------------
  
function quicksort(items, left, right, partition_property) {
    let index;
    if (items.length > 1) {
        index = partition_by_elements_property(items, left, right, partition_property); 
        if (left < index - 1) { 
            quicksort(items, left, index - 1, partition_property);
        }
        if (index < right) { 
            quicksort(items, index, right, partition_property);
        }
    }
    return items;
}
  
//  -------------------------------------------------------------------------------------------------------


exports.swap = swap;
exports.partition_by_elements_property = partition_by_elements_property;
exports.quicksort = quicksort;