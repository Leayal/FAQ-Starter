function IEnumerator(_array) {
    this.arr = _array;
    this.currentIndex = -1;
    this.maxIndex = this.arr.length;
    this.Item = null;
}

IEnumerator.prototype.getNext = function() {
    var nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.maxIndex)
        return false;
    else {
        this.currentIndex = nextIndex;
        this.Item = this.arr[this.currentIndex];
        return true;
    }
}

Array.prototype.getIEnumerator = function() {
    return new IEnumerator(this);
}

function DIEnumerator(dict) {
    this.source = dict;
    this.arr = Object.keys(dict);
    this.currentIndex = -1;
    this.maxIndex = this.arr.length;
    this.Item = null;
}

function KeyValuePair(_key, _value) {
    this.Key = _key;
    this.Value = _value;
}

DIEnumerator.prototype.getNext = function() {
    var nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.maxIndex)
        return false;
    else {
        this.currentIndex = nextIndex;
        this.Item = new KeyValuePair(this.arr[this.currentIndex], this.source[this.arr[this.currentIndex]]);
        return true;
    }
}

// For dictionary-like ???
Object.prototype.getDIEnumerator = function() {
    return new DIEnumerator(this);
}