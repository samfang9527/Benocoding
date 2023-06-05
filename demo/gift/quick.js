
const arr = [2, 7, 3, 12, 5, 8, 10];

const quickSort = (arr) => {
    if (arr.length <= 1) return arr;
    const pivot = arr[0];
    const leftArr = [];
    const rightArr = [];
    for (let i = 1; i < arr.length; i++) {
        arr[i] <= pivot ? leftArr.push(arr[i]) : rightArr.push(arr[i]);
    }
    leftArr.push(pivot);
    return quickSort(leftArr).concat(quickSort(rightArr));
};

console.log(quickSort(arr)); // [2, 3, 5, 7, 8, 10, 12]
