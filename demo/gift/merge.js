const arr = [2, 7, 3, 12, 5, 8, 10];

const merge = (left, right) => {
    let mergeArr = [];
    while (left.length > 0 && right.length > 0) {
        const minNum = left[0] < right[0] ? left.shift() : right.shift();
        mergeArr.push(minNum);
    }
    mergeArr = left.length ? mergeArr.concat(left) : mergeArr.concat(right);
    return mergeArr;
}

const mergeSort = (arr) => {
    if (arr.length <= 1) {
        return arr;
    } else {
        const mid = Math.floor(arr.length / 2);
        const leftArr = arr.slice(0, mid);
        const rightArr = arr.slice(mid);
        return merge(mergeSort(leftArr), mergeSort(rightArr));
    }
};

console.log(mergeSort(arr)); // [2, 3, 5, 7, 8, 10, 12]